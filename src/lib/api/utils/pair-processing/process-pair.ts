
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
import { getInteractionFromDatabase, compareAndUpdateDatabaseResult } from './database-ops';

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

    // Check if we already have cached results for this interaction
    let cachedResult = null;
    if (hasInteractionCache(med1, med2)) {
      console.log(`Found cached interaction data for ${med1} + ${med2}, but will still query APIs`);
      cachedResult = getCachedInteractionResult(med1, med2);
    }

    // Get any existing database result
    const dbResult = await getInteractionFromDatabase(med1, med2);
    if (dbResult) {
      console.log(`Found database result for ${med1} + ${med2}, but will still query APIs`);
    }

    // Always process all API interactions for this medication pair
    let apiResult = null;
    try {
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

      apiResult = {
        medications: [med1, med2],
        severity,
        description,
        sources: finalSources,
        adverseEvents: adverseEventsResult || undefined,
        confidenceScore,
        aiValidated,
        fromExternalApi: true
      };
      
      // Log the final API result
      console.log(`Processed API interaction result for ${med1} + ${med2}:`, {
        severity: apiResult.severity,
        sourceCount: apiResult.sources.length,
        confidenceScore: apiResult.confidenceScore
      });
      
    } catch (apiError) {
      console.error(`Error processing API interaction for ${med1} + ${med2}:`, apiError);
      if (apiError.message?.includes('404') || apiError.status === 404) {
        console.warn(`[VitaCheck API] Skipped RxNorm query due to Netlify function error (404). Retrying or fallback may be needed.`);
      }
    }

    // Use API result if available, otherwise fallback to DB or cache
    let finalResult: InteractionResult;
    
    if (apiResult && apiResult.sources && apiResult.sources.length > 0 && 
        apiResult.sources.some(s => s.name !== "No Data Available" && s.name !== "Unknown")) {
      // Use API result and update database
      finalResult = apiResult;
      
      // If we have an existing DB result, compare and update if needed
      if (dbResult) {
        await compareAndUpdateDatabaseResult(med1, med2, apiResult, dbResult);
      } else {
        // Save new API result to database
        await saveInteractionToDatabase(med1, med2, apiResult);
      }
    } else if (dbResult) {
      // Fallback to database result if API call failed or returned no data
      console.log(`Using database result as fallback for ${med1} + ${med2}`);
      
      // Add fallback flag to inform user
      const enhancedSources = dbResult.sources.map(source => ({
        ...source,
        fallbackMode: true
      }));
      
      finalResult = {
        ...dbResult,
        sources: enhancedSources,
        fromDatabase: true
      };
    } else if (cachedResult) {
      // Fallback to session cache as last resort
      console.log(`Using cached result as fallback for ${med1} + ${med2}`);
      finalResult = {
        ...cachedResult,
        fromCache: true
      };
    } else {
      // No data available from any source
      return createFallbackInteractionResult(med1, med2, 
        `No interaction data available for ${med1} and ${med2} from any source.`);
    }
    
    // Cache the final result for future lookups during this session
    cacheInteractionResult(med1, med2, finalResult);

    return finalResult;
  } catch (error) {
    console.error(`Error processing medication pair ${med1} + ${med2}:`, error);
    return createFallbackInteractionResult(med1, med2, 
      `An error occurred while processing this medication pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Import severity processor from the dedicated module
import { determineFinalSeverity, createDefaultSource } from '../severity-processor';
