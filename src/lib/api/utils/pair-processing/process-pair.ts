
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
import { saveInteractionToDatabase, getDatabaseInteraction } from './database-ops';

/**
 * Processes a pair of medications to determine potential interactions
 * and saves the results to the database
 * 
 * This function:
 * 1. Queries multiple medical databases (RxNorm, SUPP.AI, FDA) simultaneously
 * 2. Aggregates and merges the results from all sources
 * 3. Determines the final severity rating based on all available data
 * 4. Uses the database as a fallback only when APIs return no data
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
  // Check for known high-risk combinations first
  const highRiskResult = checkForHighRiskPair(med1, med2);
  if (highRiskResult) {
    // Save high-risk interaction to the database
    await saveInteractionToDatabase(med1, med2, highRiskResult);
    return highRiskResult;
  }

  // Get medication statuses
  const med1Status = medicationStatuses.get(med1);
  const med2Status = medicationStatuses.get(med2);
  
  if (!med1Status || !med2Status) {
    console.warn(`Missing medication status for ${!med1Status ? med1 : med2}`);
    return createFallbackInteractionResult(med1, med2, 
      "Unable to process this medication pair due to missing medication information.");
  }

  try {
    // Check if we already have cached results for this interaction
    let sessionCached = false;
    if (hasInteractionCache(med1, med2)) {
      console.log(`Using cached interaction data for ${med1} + ${med2}`);
      const cachedResult = getCachedInteractionResult(med1, med2);
      
      // Even for cached results, verify they are valid
      if (cachedResult && cachedResult.severity) {
        sessionCached = true;
        
        // We still want to process the API interactions and update if needed,
        // but we'll return the cached result immediately for better UX
        console.log(`Returning cached result for ${med1} + ${med2} immediately while refreshing in background`);
        
        // Start the API processing in the background
        setTimeout(() => {
          refreshInteractionData(med1, med2, med1Status, med2Status);
        }, 100);
        
        return cachedResult;
      } else {
        console.warn(`Invalid cached result for ${med1} + ${med2}, processing normally`);
      }
    }
    
    // Process API interactions - always query external APIs first
    console.log(`⚙️ Querying all external APIs for ${med1} + ${med2}`);
    
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
    
    // Check if we got any meaningful API results
    const hasApiResults = sources.length > 0 && sources.some(s => s.name !== "No Data Available");
    
    if (hasApiResults) {
      // Use API results if available
      console.log(`✅ Using API results for ${med1} + ${med2}`);
      
      // Determine final severity and description based on all results
      const { severity, description, confidenceScore, aiValidated } = determineFinalSeverity(
        rxnormResult,
        suppaiResult,
        fdaResult,
        adverseEventsResult,
        sources
      );

      const finalResult = {
        medications: [med1, med2],
        severity,
        description,
        sources,
        adverseEvents: adverseEventsResult || undefined,
        confidenceScore,
        aiValidated
      };
      
      // Save the processed interaction to the database for future reference
      await saveInteractionToDatabase(med1, med2, finalResult);
      
      // Cache the result for this session
      cacheInteractionResult(med1, med2, finalResult);
      
      return finalResult;
    } else {
      // If API calls return no usable data, then try the database as fallback
      console.log(`⚠️ No API results for ${med1} + ${med2}, checking database fallback`);
      
      const dbInteraction = await getDatabaseInteraction(med1, med2);
      
      if (dbInteraction) {
        console.log(`✅ Using database fallback for ${med1} + ${med2}`);
        
        // Create a fallback result from database data
        const dbFallbackResult: InteractionResult = {
          medications: [med1, med2],
          severity: dbInteraction.severity,
          description: `This interaction data is from the VitaCheck Safety Database. No current external API data was found. Last updated: ${new Date(dbInteraction.last_checked).toLocaleDateString()}.`,
          sources: [
            {
              name: "VitaCheck Safety Database",
              severity: dbInteraction.severity,
              description: "This data is from previously cached API results. No current external API data was found.",
              confidence: dbInteraction.confidence_level,
              fallbackMode: true,
              fallbackReason: "No current API data available",
              timestamp: dbInteraction.last_checked
            }
          ],
          confidenceScore: dbInteraction.confidence_level,
          aiValidated: false
        };
        
        // Cache this result for the session
        cacheInteractionResult(med1, med2, dbFallbackResult);
        
        return dbFallbackResult;
      }
      
      // If no data available anywhere, return a generic fallback
      console.log(`⚠️ No data available for ${med1} + ${med2} from any source`);
      const fallbackResult = createFallbackInteractionResult(med1, med2);
      
      return fallbackResult;
    }
  } catch (error) {
    console.error(`Error processing medication pair ${med1} + ${med2}:`, error);
    return createFallbackInteractionResult(med1, med2, 
      `An error occurred while processing this medication pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Background refresh of interaction data to keep the database current
 */
async function refreshInteractionData(
  med1: string,
  med2: string,
  med1Status: MedicationLookupResult,
  med2Status: MedicationLookupResult
): Promise<void> {
  try {
    console.log(`🔄 Background refreshing data for ${med1} + ${med2}`);
    
    const {
      rxnormResult, 
      suppaiResult, 
      fdaResult, 
      adverseEventsResult,
      aiAnalysisResult,
      sources 
    } = await processApiInteractions(med1Status, med2Status, med1, med2);
    
    // Check if we got any meaningful API results
    const hasApiResults = sources.length > 0 && sources.some(s => s.name !== "No Data Available");
    
    if (hasApiResults) {
      // Determine final severity and description based on all results
      const { severity, description, confidenceScore, aiValidated } = determineFinalSeverity(
        rxnormResult,
        suppaiResult,
        fdaResult,
        adverseEventsResult,
        sources
      );

      const updatedResult = {
        medications: [med1, med2],
        severity,
        description,
        sources,
        adverseEvents: adverseEventsResult || undefined,
        confidenceScore,
        aiValidated
      };
      
      // Save the refreshed data to the database
      await saveInteractionToDatabase(med1, med2, updatedResult);
      
      // Update the session cache
      cacheInteractionResult(med1, med2, updatedResult);
      
      console.log(`✅ Successfully refreshed data for ${med1} + ${med2}`);
    } else {
      console.log(`⚠️ No API results found during background refresh for ${med1} + ${med2}`);
    }
  } catch (error) {
    console.error(`Error during background refresh for ${med1} + ${med2}:`, error);
  }
}

// Import severity processor from the dedicated module
import { determineFinalSeverity, createDefaultSource } from '../severity-processor';
