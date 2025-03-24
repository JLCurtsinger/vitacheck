
/**
 * Medication Pair Processing Utilities
 * 
 * This module handles the core logic for processing medication pairs and determining
 * interaction severity based on multiple data sources. It implements a comprehensive
 * checking system that queries multiple medical databases and aggregates their results.
 * 
 * @module pair-processing-utils
 */

import { InteractionResult, MedicationLookupResult } from '../types';
import { checkRxNormInteractions } from '../services/interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from '../services/interactions/suppai-interactions';
import { checkFDAInteractions } from '../services/interactions/fda-interactions';
import { checkHighRiskCombination } from './high-risk-interactions';
import { getAdverseEvents } from '../openfda-events';
import { generateMedicationPairs } from './medication-pairs';
import { determineFinalSeverity, createDefaultSource } from './severity-processor';
import { processAdverseEventsSource } from './adverse-events-processor';
import { queryAiLiteratureAnalysis } from '../services/ai-literature-analysis';

// Cache for medication pair processing to ensure consistent results
const pairProcessingCache = new Map<string, InteractionResult>();

// Re-export generateMedicationPairs for backward compatibility
export { generateMedicationPairs } from './medication-pairs';

/**
 * Get a unique key for caching medication pair results
 */
function getPairCacheKey(med1: string, med2: string): string {
  // Sort medications for consistent key regardless of order
  return [med1.toLowerCase(), med2.toLowerCase()].sort().join('|');
}

/**
 * Processes a pair of medications to determine potential interactions
 * 
 * This function:
 * 1. Queries multiple medical databases (RxNorm, SUPP.AI, FDA) simultaneously
 * 2. Aggregates and merges the results from all sources
 * 3. Determines the final severity rating based on all available data
 * 4. Ensures interactions are always displayed if any API detects them
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @param medicationStatuses - Map of medication lookup results
 * @returns Processed interaction result with severity and warnings
 */
export async function processMedicationPair(
  med1: string,
  med2: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  // Generate cache key for this medication pair
  const cacheKey = getPairCacheKey(med1, med2);
  
  // Check if we already have cached results
  if (pairProcessingCache.has(cacheKey)) {
    console.log(`Using cached interaction data for ${med1} + ${med2}`);
    return pairProcessingCache.get(cacheKey)!;
  }
  
  const med1Status = medicationStatuses.get(med1)!;
  const med2Status = medicationStatuses.get(med2)!;
  
  // First check for known high-risk combinations
  const highRiskCheck = checkHighRiskCombination(med1, med2);
  if (highRiskCheck.isHighRisk) {
    const result = {
      medications: [med1, med2],
      severity: "severe" as const,
      description: highRiskCheck.description || "High risk combination detected",
      sources: [{
        name: "VitaCheck Safety Database",
        severity: "severe" as const,
        description: highRiskCheck.description,
        confidence: 95 // High confidence for known high-risk combinations
      }],
      confidenceScore: 95,
      aiValidated: false
    };
    
    // Cache the result
    pairProcessingCache.set(cacheKey, result);
    return result;
  }

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
  const [rxnormResult, suppaiResult, fdaResult, adverseEventsResult] = apiResults;
  
  // Try to get AI result but don't let it block the process
  const aiAnalysisResult = await aiAnalysisPromise;
  
  console.log('API Results:', {
    rxnorm: rxnormResult ? `Found: ${rxnormResult.severity}` : 'No data',
    suppai: suppaiResult ? `Found: ${suppaiResult.severity}` : 'No data',
    fda: fdaResult ? `Found: ${fdaResult.severity}` : 'No data',
    adverseEvents: adverseEventsResult ? `Found ${adverseEventsResult.eventCount} events` : 'No data',
    aiAnalysis: aiAnalysisResult ? `Found: ${aiAnalysisResult.severity}` : 'No data'
  });

  // Merge all sources from different APIs and add confidence values
  const sources = [];
  
  // Add RxNorm sources if available - with more specific confidence values
  if (rxnormResult) {
    rxnormResult.sources.forEach(source => {
      // Only add 90% confidence if the source has actual interaction data
      const confidence = source.description && 
                          !source.description.toLowerCase().includes('no interaction') ? 90 : 70;
      sources.push({
        ...source,
        confidence
      });
    });
  }
  
  // Add SUPP.AI sources if available
  if (suppaiResult) {
    suppaiResult.sources.forEach(source => {
      // Adjust confidence based on evidence quality
      const hasStrongEvidence = source.description && 
                               (source.description.toLowerCase().includes('evidence') ||
                                source.description.toLowerCase().includes('study'));
      
      sources.push({
        ...source,
        confidence: hasStrongEvidence ? 65 : 55 // Higher confidence for evidence-based findings
      });
    });
  }
  
  // Add FDA sources if available
  if (fdaResult) {
    fdaResult.sources.forEach(source => {
      // FDA black box warnings are more reliable
      const isBlackBoxWarning = source.description && 
                               (source.description.toLowerCase().includes('black box') ||
                                source.description.toLowerCase().includes('boxed warning'));
      
      sources.push({
        ...source,
        confidence: isBlackBoxWarning ? 85 : 75 // Higher confidence for black box warnings
      });
    });
  }
  
  // Add adverse events as a source if found - always high confidence as it's real-world data
  const adverseEventSource = processAdverseEventsSource(adverseEventsResult);
  if (adverseEventSource) {
    const eventCount = adverseEventsResult?.eventCount || 0;
    // Scale confidence based on event count - more events = higher confidence
    const confidenceBoost = Math.min(15, Math.floor(eventCount / 10)); // Up to +15% for many events
    
    sources.push({
      ...adverseEventSource,
      confidence: 75 + confidenceBoost // Base 75% + boost based on event count
    });
  }

  // Add AI Literature Analysis result if available
  let aiValidated = false;
  if (aiAnalysisResult) {
    // For AI results, confidence is based on the quality of citations
    const hasCitations = aiAnalysisResult.description &&
                         (aiAnalysisResult.description.toLowerCase().includes('study') || 
                          aiAnalysisResult.description.toLowerCase().includes('research') ||
                          aiAnalysisResult.description.toLowerCase().includes('evidence'));
    
    sources.push({
      ...aiAnalysisResult,
      confidence: hasCitations ? 60 : 45 // Higher confidence for cited AI analysis
    });
    aiValidated = true;
    console.log('Added AI literature analysis:', aiAnalysisResult);
  }

  // Determine final severity and description based on all results
  const { severity, description, confidenceScore } = determineFinalSeverity(
    rxnormResult,
    suppaiResult,
    fdaResult,
    adverseEventsResult,
    sources
  );

  // Ensure we always have at least one source entry
  if (sources.length === 0) {
    sources.push(createDefaultSource());
  }

  const result = {
    medications: [med1, med2],
    severity,
    description,
    sources,
    adverseEvents: adverseEventsResult || undefined,
    confidenceScore,
    aiValidated
  };
  
  // Cache the result for future lookups
  pairProcessingCache.set(cacheKey, result);

  return result;
}
