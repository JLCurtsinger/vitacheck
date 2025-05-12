/**
 * Medication Pair Processing
 * 
 * This module handles the core logic for processing medication pairs and determining
 * interaction severity based on multiple data sources.
 */

import { InteractionResult, MedicationLookupResult, InteractionSource } from '../../types';
import { createFallbackInteractionResult } from './fallback-result';
import { hasInteractionCache, getCachedInteractionResult, cacheInteractionResult } from './cache-utils';
import { checkForHighRiskPair } from './check-high-risk';
import { processApiInteractions } from '../api-interactions-processor';
import { saveInteractionToDatabase, getDatabaseInteraction } from './database-ops';
import { determineFinalSeverity, createDefaultSource } from '../severity-processor';

/**
 * Calculates the average confidence score from a list of sources
 */
function calculateAverageConfidence(sources: InteractionSource[]): number {
  if (!sources?.length) return 0;
  
  const validScores = sources
    .map(s => s?.confidence)
    .filter((score): score is number => score !== undefined && !isNaN(score));
    
  return validScores.length > 0
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    : 0;
}

/**
 * Generates a description for the interaction based on the sources
 */
function generateInteractionDescription(sources: InteractionSource[], med1: string, med2: string): string {
  if (!sources?.length) {
    return `No interaction data available for the combination of ${med1} and ${med2}.`;
  }

  const validSources = sources.filter(s => s?.description);
  if (!validSources.length) {
    return `No detailed interaction data available for ${med1} and ${med2}.`;
  }

  // Use the most severe source's description
  const severityOrder = { 'severe': 0, 'moderate': 1, 'minor': 2, 'unknown': 3, 'safe': 4 };
  const mostSevereSource = validSources.reduce((most, current) => 
    severityOrder[current.severity] < severityOrder[most.severity] ? current : most
  );

  return mostSevereSource.description || 
    `Interaction between ${med1} and ${med2} has been identified as ${mostSevereSource.severity}.`;
}

/**
 * Determines if a new API result should replace an existing database result
 * based on various quality and freshness criteria
 */
function shouldUpdateInteraction(
  newResult: InteractionResult,
  existingResult: {
    id: string;
    severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
    confidence_level: number;
    sources: string[];
    last_checked: string;
  } | null
): boolean {
  if (!existingResult) return true;
  if (!newResult?.sources || !Array.isArray(newResult.sources)) {
    console.warn('Cannot update interaction: new result has invalid sources');
    return false;
  }

  // Check for more sources
  if (newResult.sources.length > (existingResult.sources?.length || 0)) return true;

  // Check for higher confidence score (at least 0.1 higher)
  if (newResult.confidenceScore && newResult.confidenceScore > (existingResult.confidence_level + 0.1)) return true;

  // Check for more severe interaction
  const severityLevels = { 'none': 0, 'mild': 1, 'moderate': 2, 'severe': 3, 'contraindicated': 4 };
  if (severityLevels[newResult.severity] > severityLevels[existingResult.severity]) return true;

  // Check for AI validation when it wasn't present before
  if (newResult.aiValidated) return true;

  // Check if the new result is significantly newer (≥ 7 days)
  const newTimestamp = new Date(newResult.sources[0]?.timestamp || Date.now());
  const oldTimestamp = new Date(existingResult.last_checked);
  const daysDifference = (newTimestamp.getTime() - oldTimestamp.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysDifference >= 7;
}

/**
 * Maps a database interaction result to the InteractionResult type
 */
function mapDatabaseResultToInteractionResult(
  dbResult: {
    id: string;
    severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
    confidence_level: number;
    sources: string[];
    last_checked: string;
  },
  med1: string,
  med2: string
): InteractionResult {
  if (!dbResult?.severity || !dbResult?.confidence_level) {
    console.warn(`Invalid database result for ${med1} + ${med2}, using fallback values`);
    return createFallbackInteractionResult(med1, med2);
  }

  const source: InteractionSource = {
    name: "VitaCheck Safety Database",
    severity: dbResult.severity,
    description: "This data is from previously cached API results. No current external API data was found.",
    confidence: dbResult.confidence_level,
    isReliable: true,
    fallbackMode: true,
    fallbackReason: "No current API data available",
    timestamp: dbResult.last_checked,
    processed: true,
    hasInsight: true,
    hasDirectEvidence: false
  };

  return {
    medications: [med1, med2],
    severity: dbResult.severity,
    description: `This interaction data is from the VitaCheck Safety Database. No current external API data was found. Last updated: ${new Date(dbResult.last_checked).toLocaleDateString()}.`,
    sources: [source],
    confidenceScore: dbResult.confidence_level,
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
  try {
    // Check for known high-risk combinations first
    const highRiskResult = checkForHighRiskPair(med1, med2);
    if (highRiskResult) {
      console.log(`Found high-risk combination for ${med1} + ${med2}`);
      return highRiskResult;
    }

    // Check cache for existing result
    const cachedResult = getCachedInteractionResult(med1, med2);
    if (cachedResult?.sources && Array.isArray(cachedResult.sources) && cachedResult.sources.length > 0) {
      console.log(`Using cached result for ${med1} + ${med2}`);
      return cachedResult;
    }

    // Get medication statuses
    const med1Status = medicationStatuses.get(med1);
    const med2Status = medicationStatuses.get(med2);

    if (!med1Status || !med2Status) {
      console.warn(`Missing medication status for ${med1} or ${med2}`);
      return createFallbackInteractionResult(med1, med2);
    }

    // Always query external APIs first
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
      sourceCount: sources?.length || 0
    });

    // Get existing database result for comparison
    const existingResult = await getDatabaseInteraction(med1, med2);
    
    // Check if we got any meaningful API results
    const hasApiResults = sources?.length > 0 && sources.some(s => s?.name && s.name !== "No Data Available");

    if (hasApiResults) {
      // Process API results and determine final severity
      const { severity, description, confidenceScore, aiValidated } = determineFinalSeverity(
        rxnormResult,
        suppaiResult,
        fdaResult,
        adverseEventsResult,
        sources
      );
      
      const result: InteractionResult = {
        medications: [med1, med2],
        severity,
        description,
        sources: sources.filter(s => s?.name && s?.severity), // Filter out any invalid sources
        confidenceScore,
        aiValidated
      };

      // Save to database if it's better than existing result
      if (shouldUpdateInteraction(result, existingResult)) {
        await saveInteractionToDatabase(med1, med2, result);
      }

      // Cache the result
      cacheInteractionResult(med1, med2, result);
      
      return result;
    }

    // If no API results, try to use database result
    if (existingResult) {
      console.log(`Using database result for ${med1} + ${med2}`);
      return mapDatabaseResultToInteractionResult(existingResult, med1, med2);
    }

    // If no results anywhere, return fallback
    console.warn(`No results found for ${med1} + ${med2}, using fallback`);
    return createFallbackInteractionResult(med1, med2);
    
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
