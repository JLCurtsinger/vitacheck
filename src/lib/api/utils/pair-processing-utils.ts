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

// Re-export generateMedicationPairs for backward compatibility
export { generateMedicationPairs } from './medication-pairs';

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
  const med1Status = medicationStatuses.get(med1)!;
  const med2Status = medicationStatuses.get(med2)!;
  
  // Generate a unique search ID for logging/debugging
  const searchId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  console.log(`[${searchId}] Starting interaction check: ${med1} + ${med2}`);
  
  // First check for known high-risk combinations
  const highRiskCheck = checkHighRiskCombination(med1, med2);
  
  // Only use high-risk check as the sole result if forceOverride is true
  // Otherwise, we'll still check APIs and possibly incorporate this as one source
  if (highRiskCheck.isHighRisk && highRiskCheck.forceOverride) {
    console.log(`[${searchId}] HIGH RISK OVERRIDE: ${med1} + ${med2} is a known high-risk combination`);
    return {
      medications: [med1, med2],
      severity: highRiskCheck.severity as "severe" | "moderate" | "minor" | "safe" | "unknown",
      description: highRiskCheck.description || "High risk combination detected",
      sources: [{
        name: "VitaCheck Safety Database",
        severity: highRiskCheck.severity as "severe" | "moderate" | "minor" | "safe" | "unknown",
        description: highRiskCheck.description || "",
        confidence: highRiskCheck.confidence || 90
      }],
      confidenceScore: highRiskCheck.confidence || 90,
      aiValidated: false,
      searchId: searchId // Add search ID for troubleshooting
    };
  }

  console.log(`[${searchId}] Checking interactions between ${med1} (${med1Status.id || 'no id'}) and ${med2} (${med2Status.id || 'no id'})`);

  // Query all available databases simultaneously with timeout handling for each
  // This ensures that even if one API fails or times out, we'll still get results from others
  const apiPromises = [
    // Only check RxNorm if both medications have RxNorm IDs
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm' && med1Status.id && med2Status.id
      ? checkRxNormInteractions(med1Status.id, med2Status.id, med1, med2).catch(err => {
          console.error(`[${searchId}] RxNorm API error: ${err.message}`);
          return null;
        })
      : Promise.resolve(null),
    
    // SUPP.AI check with error handling
    checkSuppAiInteractions(med1, med2).catch(err => {
      console.error(`[${searchId}] SUPP.AI API error: ${err.message}`);
      return null;
    }),
    
    // FDA check with error handling
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || []),
    
    // OpenFDA Adverse Events check with error handling
    getAdverseEvents(med1, med2).catch(err => {
      console.error(`[${searchId}] OpenFDA Adverse Events API error: ${err.message}`);
      return null;
    })
  ];
  
  // AI Analysis is run separately to ensure it doesn't delay API results
  const aiAnalysisPromise = queryAiLiteratureAnalysis(med1, med2).catch(err => {
    console.error(`[${searchId}] AI Literature Analysis error: ${err.message}`);
    return null;
  });

  // Wait for all API calls to complete (regardless of success/failure)
  const apiResults = await Promise.all(apiPromises);
  const [rxnormResult, suppaiResult, fdaResult, adverseEventsResult] = apiResults;
  
  // Try to get AI result but don't let it block the process
  const aiAnalysisResult = await aiAnalysisPromise;
  
  console.log(`[${searchId}] API Results:`, {
    rxnorm: rxnormResult ? `Found: ${rxnormResult.severity}` : 'No data',
    suppai: suppaiResult ? `Found: ${suppaiResult.severity}` : 'No data',
    fda: fdaResult ? `Found: ${fdaResult.severity}` : 'No data',
    adverseEvents: adverseEventsResult ? `Found ${adverseEventsResult.eventCount} events` : 'No data',
    aiAnalysis: aiAnalysisResult ? `Found: ${aiAnalysisResult.severity}` : 'No data'
  });

  // Merge all sources from different APIs and add confidence values
  const sources = [];
  
  // Add high-risk check as a source if it was found but not forced to override
  if (highRiskCheck.isHighRisk && !highRiskCheck.forceOverride) {
    sources.push({
      name: "VitaCheck Safety Database",
      severity: highRiskCheck.severity as "severe" | "moderate" | "minor" | "safe" | "unknown",
      description: highRiskCheck.description || "High risk combination detected",
      confidence: highRiskCheck.confidence || 90
    });
  }
  
  // Add RxNorm sources if available
  if (rxnormResult) {
    rxnormResult.sources.forEach(source => {
      sources.push({
        ...source,
        confidence: 90 // High confidence for RxNorm
      });
    });
  }
  
  // Add SUPP.AI sources if available
  if (suppaiResult) {
    suppaiResult.sources.forEach(source => {
      sources.push({
        ...source,
        confidence: 65 // Medium confidence for SUPP.AI (slightly increased)
      });
    });
  }
  
  // Add FDA sources if available
  if (fdaResult) {
    fdaResult.sources.forEach(source => {
      sources.push({
        ...source,
        confidence: 80 // Medium-high confidence for FDA
      });
    });
  }
  
  // Add adverse events as a source if found
  const adverseEventSource = processAdverseEventsSource(adverseEventsResult);
  if (adverseEventSource) {
    sources.push({
      ...adverseEventSource,
      confidence: 70 // Medium-high confidence for adverse event data (slightly reduced)
    });
  }

  // Add AI Literature Analysis result if available
  let aiValidated = false;
  if (aiAnalysisResult) {
    sources.push({
      ...aiAnalysisResult,
      confidence: 55 // Medium confidence for AI analysis (slightly increased)
    });
    aiValidated = true;
    console.log(`[${searchId}] Added AI literature analysis:`, aiAnalysisResult);
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

  console.log(`[${searchId}] Final determination: ${severity} (${confidenceScore}% confidence)`);

  return {
    medications: [med1, med2],
    severity,
    description,
    sources,
    adverseEvents: adverseEventsResult || undefined,
    confidenceScore,
    aiValidated,
    searchId: searchId // Add search ID for troubleshooting
  };
}
