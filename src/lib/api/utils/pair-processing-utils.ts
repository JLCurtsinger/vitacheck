
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
import { determineFinalSeverity, createDefaultSource } from './severity-processor';
import { generateMedicationPairs } from './medication-pairs';
import { hasInteractionCache, getCachedInteractionResult, cacheInteractionResult } from './interaction-cache';
import { checkForHighRiskPair } from './high-risk-checker';
import { processApiInteractions } from './api-interactions-processor';

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
  // Check if we already have cached results
  if (hasInteractionCache(med1, med2)) {
    console.log(`Using cached interaction data for ${med1} + ${med2}`);
    return getCachedInteractionResult(med1, med2)!;
  }
  
  const med1Status = medicationStatuses.get(med1)!;
  const med2Status = medicationStatuses.get(med2)!;
  
  // First check for known high-risk combinations
  const highRiskResult = checkForHighRiskPair(med1, med2);
  if (highRiskResult) {
    return highRiskResult;
  }

  // Process all API interactions for this medication pair
  const { 
    rxnormResult, 
    suppaiResult, 
    fdaResult, 
    adverseEventsResult,
    aiAnalysisResult,
    sources 
  } = await processApiInteractions(med1Status, med2Status, med1, med2);
  
  // Determine final severity and description based on all results
  const { severity, description, confidenceScore, aiValidated } = determineFinalSeverity(
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
  cacheInteractionResult(med1, med2, result);

  return result;
}
