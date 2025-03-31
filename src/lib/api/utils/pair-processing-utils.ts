
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
import { findOrCreateInteractionByNames } from '@/lib/api/db/interactions';
import { useToast } from '@/hooks/use-toast';

// Session-level cache for API interactions
const apiInteractionsCache = new Map<string, any>();

// Helper function to generate a consistent cache key for API interactions
function getApiCacheKey(med1: string, med2: string): string {
  return [med1.toLowerCase(), med2.toLowerCase()].sort().join('+');
}

// Re-export generateMedicationPairs for backward compatibility
export { generateMedicationPairs } from './medication-pairs';

/**
 * Creates a fallback interaction result when API data is unavailable
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @param customDescription - Optional custom description
 * @returns A valid fallback InteractionResult
 */
export function createFallbackInteractionResult(
  med1: string, 
  med2: string,
  customDescription?: string
): InteractionResult {
  const description = customDescription || 
    `No interaction data available for the combination of ${med1} and ${med2}.`;
  
  return {
    medications: [med1, med2],
    severity: "unknown",
    description,
    sources: [createDefaultSource()],
    confidenceScore: 0,
    aiValidated: false
  };
}

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

    // Check API interactions cache
    const apiCacheKey = getApiCacheKey(med1, med2);
    let apiResult;
    
    if (apiInteractionsCache.has(apiCacheKey)) {
      console.log(`Using cached API interaction data for ${med1} + ${med2}`);
      apiResult = apiInteractionsCache.get(apiCacheKey);
    } else {
      // Process all API interactions for this medication pair
      apiResult = await processApiInteractions(med1Status, med2Status, med1, med2);
      // Cache the API result
      apiInteractionsCache.set(apiCacheKey, apiResult);
    }
    
    const { 
      rxnormResult, 
      suppaiResult, 
      fdaResult, 
      adverseEventsResult,
      aiAnalysisResult,
      sources 
    } = apiResult;
    
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

/**
 * Saves interaction result to the database
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @param result Interaction result
 */
async function saveInteractionToDatabase(
  med1: string,
  med2: string,
  result: InteractionResult
): Promise<void> {
  try {
    // Create or find the interaction in the database
    const dbInteraction = await findOrCreateInteractionByNames(med1, med2);
    
    if (!dbInteraction) {
      console.error(`Failed to save interaction between ${med1} and ${med2} to database`);
      return;
    }
    
    // Extract source names for storage
    const sourceNames = result.sources.map(source => source.name);
    
    // Update the interaction with the processed data
    const { error } = await supabase
      .from('interactions')
      .update({
        interaction_detected: result.severity !== "safe" && result.severity !== "unknown",
        severity: result.severity,
        risk_score: result.confidenceScore,
        confidence_level: result.confidenceScore,
        sources: sourceNames,
        last_checked: new Date().toISOString()
      })
      .eq('id', dbInteraction.id);
    
    if (error) {
      console.error(`Error saving interaction between ${med1} and ${med2} to database:`, error);
    } else {
      console.log(`Successfully saved interaction between ${med1} and ${med2} to database`);
    }
  } catch (error) {
    console.error(`Error in saveInteractionToDatabase for ${med1} + ${med2}:`, error);
  }
}

// Import supabase client for database operations
import { supabase } from "@/integrations/supabase/client";
