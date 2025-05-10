
/**
 * Database Operations for Medication Pairs
 * 
 * This module handles database operations for medication interactions.
 */

import { InteractionResult } from '../../types';
import { findOrCreateInteractionByNames } from '@/lib/api/db/interactions';
import { supabase } from "@/integrations/supabase/client";

/**
 * Saves interaction result to the database
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @param result Interaction result
 */
export async function saveInteractionToDatabase(
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

/**
 * Retrieves an interaction result from the database
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @returns Interaction result from database or null if not found
 */
export async function getInteractionFromDatabase(
  med1: string,
  med2: string
): Promise<InteractionResult | null> {
  try {
    // Find the interaction in the database
    // Fixed: Removed the extra boolean argument here
    const dbInteraction = await findOrCreateInteractionByNames(med1, med2);
    
    if (!dbInteraction) {
      return null;
    }
    
    // Check if it has been updated recently (within 24 hours)
    const lastChecked = new Date(dbInteraction.last_checked || dbInteraction.first_detected);
    const now = new Date();
    const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
    
    // Add database source attribution
    const sources = (dbInteraction.sources || []).map(sourceName => ({
      name: sourceName,
      severity: dbInteraction.severity || "unknown",
      description: `Data from VitaCheck Safety Database for ${med1} and ${med2}`,
      confidence: dbInteraction.confidence_level || 50,
      fromDatabase: true
    }));
    
    // If no sources exist in the database record, add a generic source
    if (sources.length === 0) {
      sources.push({
        name: "VitaCheck Safety Database",
        severity: dbInteraction.severity || "unknown",
        description: `Historical data for ${med1} and ${med2}`,
        confidence: dbInteraction.confidence_level || 50,
        fromDatabase: true
      });
    }
    
    return {
      medications: [med1, med2],
      severity: dbInteraction.severity || "unknown",
      description: dbInteraction.notes || `Interaction data from VitaCheck Safety Database for ${med1} and ${med2}`,
      sources: sources,
      confidenceScore: dbInteraction.confidence_level || 50,
      lastUpdated: lastChecked,
      hoursAgo: Math.round(hoursSinceLastCheck),
      fromDatabase: true
    };
  } catch (error) {
    console.error(`Error retrieving interaction from database for ${med1} + ${med2}:`, error);
    return null;
  }
}

/**
 * Compares API result to database result and updates database if the API result is better
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @param apiResult Result from external APIs
 * @param dbResult Result from database
 */
export async function compareAndUpdateDatabaseResult(
  med1: string,
  med2: string,
  apiResult: InteractionResult,
  dbResult: InteractionResult
): Promise<void> {
  try {
    // Check if API result is better than database result
    const shouldUpdate = isApiResultBetter(apiResult, dbResult);
    
    if (shouldUpdate) {
      console.log(`API result is better than database for ${med1} + ${med2}, updating database`);
      await saveInteractionToDatabase(med1, med2, apiResult);
    } else {
      console.log(`No need to update database for ${med1} + ${med2}, API result not better`);
    }
  } catch (error) {
    console.error(`Error comparing and updating database result for ${med1} + ${med2}:`, error);
  }
}

/**
 * Determines if API result is better than database result
 * 
 * @param apiResult Result from external APIs
 * @param dbResult Result from database
 * @returns True if API result is better, false otherwise
 */
function isApiResultBetter(apiResult: InteractionResult, dbResult: InteractionResult): boolean {
  // If API result has more sources, it's better
  const apiSourceCount = apiResult.sources.filter(s => 
    s.name !== "No Data Available" && s.name !== "Unknown").length;
    
  const dbSourceCount = dbResult.sources.filter(s => 
    s.name !== "No Data Available" && s.name !== "Unknown" && 
    !s.name.includes("Database")).length;
    
  if (apiSourceCount > dbSourceCount) {
    return true;
  }
  
  // If API result has higher confidence, it's better
  if ((apiResult.confidenceScore || 0) > (dbResult.confidenceScore || 0)) {
    return true;
  }
  
  // If API result has adverse events data but database doesn't, it's better
  if (apiResult.adverseEvents && !dbResult.adverseEvents) {
    return true;
  }
  
  // If API result has more specific severity and the database has unknown
  if (apiResult.severity !== "unknown" && dbResult.severity === "unknown") {
    return true;
  }
  
  return false;
}
