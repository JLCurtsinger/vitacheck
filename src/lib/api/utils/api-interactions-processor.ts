
/**
 * API Interactions Processor
 * 
 * This module handles querying multiple medication interaction APIs
 * and processing their responses.
 */

import { InteractionSource, MedicationLookupResult, AdverseEventData, StandardizedApiResponse } from '../types';
import { checkRxNormInteractions } from '../services/interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from '../services/interactions/suppai-interactions';
import { checkFDAInteractions } from '../services/interactions/fda-interactions';
import { getAdverseEvents } from '../openfda-events';
import { queryAiLiteratureAnalysis } from '../services/ai-literature-analysis';
import { processAdverseEventsSource } from './adverse-events-processor';
import { 
  standardizeApiResponse, 
  extractEventData,
  validateStandardizedResponse,
  standardizedResponseToSource
} from './api-response-standardizer';

/**
 * Processes API queries for a medication pair
 * 
 * @param med1Status First medication lookup result
 * @param med2Status Second medication lookup result 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @returns Object containing all API results and processed sources
 */
export async function processApiInteractions(
  med1Status: MedicationLookupResult,
  med2Status: MedicationLookupResult,
  med1: string,
  med2: string
): Promise<{
  rxnormResult: StandardizedApiResponse | null;
  suppaiResult: StandardizedApiResponse | null;
  fdaResult: StandardizedApiResponse | null;
  adverseEventsResult: AdverseEventData | null;
  aiAnalysisResult: StandardizedApiResponse | null;
  sources: InteractionSource[];
}> {
  console.log(`Checking interactions between ${med1} (${med1Status.id || 'no id'}) and ${med2} (${med2Status.id || 'no id'})`);

  // Query all available databases simultaneously with timeout handling for each
  // This ensures that even if one API fails or times out, we'll still get results from others
  const apiPromises = [
    // Only check RxNorm if both medications have RxNorm IDs
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm' && med1Status.id && med2Status.id
      ? checkRxNormInteractions(med1Status.id, med2Status.id, med1, med2).catch(err => {
          console.error(`RxNorm API error: ${err.message}`);
          return null;
        })
      : Promise.resolve(null),
    
    // SUPP.AI check with error handling
    checkSuppAiInteractions(med1, med2).catch(err => {
      console.error(`SUPP.AI API error: ${err.message}`);
      return null;
    }),
    
    // FDA check with error handling
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || []),
    
    // OpenFDA Adverse Events check with error handling
    getAdverseEvents(med1, med2).catch(err => {
      console.error(`OpenFDA Adverse Events API error: ${err.message}`);
      return null;
    })
  ];
  
  // AI Analysis is run separately to ensure it doesn't delay API results
  const aiAnalysisPromise = queryAiLiteratureAnalysis(med1, med2).catch(err => {
    console.error(`AI Literature Analysis error: ${err.message}`);
    return null;
  });

  // Wait for all API calls to complete (regardless of success/failure)
  const apiResults = await Promise.all(apiPromises);
  const [rxnormRawResult, suppaiRawResult, fdaRawResult, adverseEventsResult] = apiResults;
  
  // Try to get AI result but don't let it block the process
  const aiAnalysisRawResult = await aiAnalysisPromise;
  
  // Standardize each API response to ensure consistent structure
  const rxnormResult = rxnormRawResult 
    ? standardizeApiResponse("RxNorm", rxnormRawResult, rxnormRawResult.description || "") 
    : null;
    
  const suppaiResult = suppaiRawResult 
    ? standardizeApiResponse("SUPP.AI", suppaiRawResult, suppaiRawResult.description || "")
    : null;
    
  const fdaResult = fdaRawResult 
    ? standardizeApiResponse("FDA", fdaRawResult, fdaRawResult.description || "")
    : null;
    
  const aiAnalysisResult = aiAnalysisRawResult 
    ? standardizeApiResponse("AI Literature Analysis", aiAnalysisRawResult, aiAnalysisRawResult.description || "")
    : null;

  // Set severity and confidence from raw data for backward compatibility
  if (rxnormResult && rxnormRawResult) {
    rxnormResult.severity = rxnormRawResult.severity || "unknown";
    rxnormResult.confidence = rxnormRawResult.sources?.[0]?.confidence || null;
  }
  
  if (suppaiResult && suppaiRawResult) {
    suppaiResult.severity = suppaiRawResult.severity || "unknown";
    suppaiResult.confidence = suppaiRawResult.sources?.[0]?.confidence || null;
  }
  
  if (fdaResult && fdaRawResult) {
    fdaResult.severity = fdaRawResult.severity || "unknown";
    fdaResult.confidence = fdaRawResult.sources?.[0]?.confidence || null;
  }
  
  if (aiAnalysisResult && aiAnalysisRawResult) {
    aiAnalysisResult.severity = aiAnalysisRawResult.severity || "unknown";
    aiAnalysisResult.confidence = aiAnalysisRawResult.confidence || null;
  }

  console.log('API Results:', {
    rxnorm: rxnormResult ? `Found: ${rxnormResult.severity}` : 'No data',
    suppai: suppaiResult ? `Found: ${suppaiResult.severity}` : 'No data',
    fda: fdaResult ? `Found: ${fdaResult.severity}` : 'No data',
    adverseEvents: adverseEventsResult ? `Found ${adverseEventsResult.eventCount} events` : 'No data',
    aiAnalysis: aiAnalysisResult ? `Found: ${aiAnalysisResult.severity}` : 'No data'
  });

  // Merge all sources from different APIs and add confidence values
  const sources: InteractionSource[] = [];
  
  // Add RxNorm sources if available
  if (rxnormResult && rxnormRawResult) {
    rxnormRawResult.sources?.forEach((source: InteractionSource) => {
      // Only add relevant sources with interaction data
      const isRelevant = source.description && 
                        !source.description.toLowerCase().includes('no interaction');
      
      if (isRelevant) {
        sources.push({
          ...source,
          // Confidence will be dynamically calculated in consensus-system.ts
        });
      }
    });
  }
  
  // Add SUPP.AI sources if available
  if (suppaiResult && suppaiRawResult) {
    suppaiRawResult.sources?.forEach((source: InteractionSource) => {
      // Filter to only include sources with actual evidence
      const hasEvidence = source.description && 
                         (source.description.toLowerCase().includes('evidence') ||
                          source.description.toLowerCase().includes('study') ||
                          source.description.toLowerCase().includes('reported'));
      
      if (hasEvidence || source.severity !== 'unknown') {
        sources.push({
          ...source,
          // Confidence will be dynamically calculated in consensus-system.ts
        });
      }
    });
  }
  
  // Add FDA sources if available
  if (fdaResult && fdaRawResult) {
    fdaRawResult.sources?.forEach((source: InteractionSource) => {
      // FDA black box warnings are more reliable
      const hasWarning = source.description && 
                       (source.description.toLowerCase().includes('warning') ||
                        source.description.toLowerCase().includes('caution') ||
                        source.description.toLowerCase().includes('interaction'));
      
      if (hasWarning || source.severity !== 'unknown') {
        sources.push({
          ...source,
          // Confidence will be dynamically calculated in consensus-system.ts
        });
      }
    });
  }
  
  // Add adverse events as a source if found - always high confidence as it's real-world data
  const adverseEventSource = processAdverseEventsSource(adverseEventsResult);
  if (adverseEventSource) {
    // Create proper event data structure for the source
    const eventData = adverseEventsResult ? {
      totalEvents: adverseEventsResult.eventCount || 0,
      seriousEvents: adverseEventsResult.seriousCount || 0,
      nonSeriousEvents: (adverseEventsResult.eventCount || 0) - (adverseEventsResult.seriousCount || 0),
      commonReactions: adverseEventsResult.commonReactions || []
    } : undefined;
    
    sources.push({
      ...adverseEventSource,
      // For OpenFDA events, include the event data for confidence calculation
      eventData
    });
    
    // Log the event data to help with debugging
    console.log('OpenFDA Event Data added to source:', eventData);
  }

  // Add AI Literature Analysis result if available
  if (aiAnalysisResult && aiAnalysisRawResult) {
    // Only include AI results that provide meaningful interaction data
    const hasInsight = aiAnalysisResult.description &&
                     (aiAnalysisResult.description.toLowerCase().includes('study') || 
                      aiAnalysisResult.description.toLowerCase().includes('research') ||
                      aiAnalysisResult.description.toLowerCase().includes('evidence') ||
                      aiAnalysisResult.description.toLowerCase().includes('risk'));
    
    if (hasInsight || aiAnalysisResult.severity !== "unknown") {
      sources.push(aiAnalysisRawResult);
      console.log('Added AI literature analysis:', aiAnalysisRawResult);
    }
  }
  
  return {
    rxnormResult,
    suppaiResult,
    fdaResult, 
    adverseEventsResult,
    aiAnalysisResult,
    sources
  };
}
