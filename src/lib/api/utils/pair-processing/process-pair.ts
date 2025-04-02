
/**
 * Medication Pair Processing
 * 
 * This module handles the core logic for processing medication pairs and determining
 * interaction severity based on multiple data sources.
 */

import { InteractionResult, MedicationLookupResult } from '../../types';
import { createFallbackInteractionResult } from './fallback-result';
import { hasInteractionCache, getCachedInteractionResult, cacheInteractionResult } from './cache-utils';
import { checkForHighRiskPair } from './check-high-risk';
import { processApiInteractions } from '../api-interactions-processor';
import { saveInteractionToDatabase } from './database-ops';

/**
 * Processes a pair of medications to determine potential interactions
 * and saves the results to the database
 * 
 * This function:
 * 1. Queries multiple medical databases (RxNorm, SUPP.AI, FDA) simultaneously
 * 2. Aggregates and merges the results from all sources
 * 3. Determines the final severity rating based on all available data
 * 4. Ensures interactions are always displayed if any API detects them
 * 5. Saves the processed interaction to the database
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
  // Check if we already have cached results for this interaction
  if (hasInteractionCache(med1, med2)) {
    console.log(`Using cached interaction data for ${med1} + ${med2}`);
    const cachedResult = getCachedInteractionResult(med1, med2);
    
    // Even for cached results, verify they are valid
    if (!cachedResult || !cachedResult.severity) {
      console.warn(`Invalid cached result for ${med1} + ${med2}, creating fallback`);
      return createFallbackInteractionResult(med1, med2);
    }
    return cachedResult;
  }
  
  try {
    const med1Status = medicationStatuses.get(med1);
    const med2Status = medicationStatuses.get(med2);
    
    if (!med1Status || !med2Status) {
      console.warn(`Missing medication status for ${!med1Status ? med1 : med2}`);
      return createFallbackInteractionResult(med1, med2, 
        "Unable to process this medication pair due to missing medication information.");
    }
    
    // First check for known high-risk combinations
    const highRiskResult = checkForHighRiskPair(med1, med2);
    if (highRiskResult) {
      // Save high-risk interaction to the database
      await saveInteractionToDatabase(med1, med2, highRiskResult);
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
    
    console.log(`API results for ${med1} + ${med2}:`, {
      hasRxNorm: !!rxnormResult,
      hasSuppAi: !!suppaiResult,
      hasFda: !!fdaResult,
      hasAdverseEvents: !!adverseEventsResult,
      hasAiAnalysis: !!aiAnalysisResult,
      sourceCount: sources.length
    });
    
    // Determine final severity and description based on all results
    const { severity, description, confidenceScore, aiValidated } = determineFinalSeverity(
      rxnormResult,
      suppaiResult,
      fdaResult,
      adverseEventsResult,
      sources
    );

    // Ensure we always have at least one source entry
    const finalSources = sources.length > 0 ? sources : [createDefaultSource()];

    const result = {
      medications: [med1, med2],
      severity,
      description,
      sources: finalSources,
      adverseEvents: adverseEventsResult || undefined,
      confidenceScore,
      aiValidated
    };
    
    // Log the final result
    console.log(`Processed interaction result for ${med1} + ${med2}:`, {
      severity: result.severity,
      sourceCount: result.sources.length,
      confidenceScore: result.confidenceScore
    });
    
    // Save the processed interaction to the database
    await saveInteractionToDatabase(med1, med2, result);
    
    // Cache the result for future lookups
    cacheInteractionResult(med1, med2, result);

    return result;
  } catch (error) {
    console.error(`Error processing medication pair ${med1} + ${med2}:`, error);
    return createFallbackInteractionResult(med1, med2, 
      `An error occurred while processing this medication pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Import severity processor
import { determineFinalSeverity, createDefaultSource } from '../severity-processor';
