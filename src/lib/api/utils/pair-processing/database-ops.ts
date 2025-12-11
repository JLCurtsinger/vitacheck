
/**
 * Database Operations for Medication Pairs
 * 
 * This module handles database operations for medication interactions.
 */

import { InteractionResult } from '../../types';
import { findOrCreateInteractionByNames } from '@/lib/api/db/interactions';
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps a Supabase query promise with a timeout to prevent hanging
 * @param promise The Supabase query promise
 * @param operation Short description of the operation for logging
 * @param timeoutMs Timeout in milliseconds (default: 8000)
 * @returns The result if successful, or null if timeout/error
 */
async function withSupabaseTimeout<T>(
  promise: Promise<T>,
  operation: string,
  timeoutMs: number = 8000
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`⏱️ [DB Timeout] ${operation} timed out after ${timeoutMs}ms`);
        resolve(null);
      }, timeoutMs);
    });
    
    const result = await Promise.race([promise, timeoutPromise]);
    
    // Clear timeout if promise resolved/rejected first
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return result;
  } catch (error) {
    // Clear timeout on error
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Log error and return null instead of rethrowing
    console.error(`[DB Error] ${operation} failed:`, error);
    return null;
  }
}

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
    const dbInteraction = await withSupabaseTimeout(
      findOrCreateInteractionByNames(med1, med2),
      `find/create interaction for ${med1} + ${med2}`
    );
    
    if (!dbInteraction) {
      console.warn(`[DB Timeout/Error] Could not find/create interaction between ${med1} and ${med2} - skipping DB cache update`);
      return;
    }
    
    // Extract source names for storage
    const sourceNames = result.sources.map(source => source.name);
    
    // Update the interaction with the processed data
    const updateResult = await withSupabaseTimeout(
      supabase
        .from('interactions')
        .update({
          interaction_detected: result.severity !== "safe" && result.severity !== "unknown",
          severity: result.severity,
          risk_score: result.confidenceScore,
          confidence_level: result.confidenceScore,
          sources: sourceNames,
          last_checked: new Date().toISOString()
        })
        .eq('id', dbInteraction.id),
      `update interaction for ${med1} + ${med2}`
    );
    
    if (!updateResult) {
      console.warn(`[DB Timeout/Error] Could not update interaction between ${med1} and ${med2} - skipping DB cache update`);
      return;
    }
    
    const { error } = updateResult;
    
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
 * Checks if a database result is available for a medication pair
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @returns Promise resolving to the database interaction if found
 */
export async function getDatabaseInteraction(
  med1: string,
  med2: string
): Promise<{ 
  id: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidence_level: number;
  sources: string[];
  last_checked: string;
} | null> {
  try {
    console.log(`Checking database for interaction between ${med1} and ${med2}`);
    
    // Find the substance IDs
    const substancesResult = await withSupabaseTimeout(
      supabase
        .from('substances')
        .select('id')
        .in('name', [med1.toLowerCase(), med2.toLowerCase()]),
      `get substances for ${med1} + ${med2}`
    );
      
    if (!substancesResult) {
      console.warn(`[DB Timeout/Error] Could not fetch substances for ${med1} and/or ${med2}`);
      return null;
    }
    
    const { data: substances, error: substancesError } = substancesResult;
      
    if (substancesError || !substances || substances.length < 2) {
      console.log(`No substances found for ${med1} and/or ${med2}`);
      return null;
    }
    
    // Find interaction between these substances
    const interactionsResult = await withSupabaseTimeout(
      supabase
        .from('interactions')
        .select('id, severity, confidence_level, sources, last_checked')
        .or(`substance_a_id.eq.${substances[0].id},substance_a_id.eq.${substances[1].id}`)
        .or(`substance_b_id.eq.${substances[0].id},substance_b_id.eq.${substances[1].id}`),
      `get interaction for ${med1} + ${med2}`
    );
      
    if (!interactionsResult) {
      console.warn(`[DB Timeout/Error] Could not fetch interaction for ${med1} + ${med2}`);
      return null;
    }
    
    const { data: interactions, error: interactionsError } = interactionsResult;
      
    if (interactionsError || !interactions || interactions.length === 0) {
      console.log(`No interaction found in database for ${med1} + ${med2}`);
      return null;
    }
    
    // Return the found interaction
    console.log(`Found interaction in database for ${med1} + ${med2}:`, 
      interactions[0].severity, interactions[0].confidence_level);
    
    return interactions[0];
  } catch (error) {
    console.error(`Error checking database for interaction ${med1} + ${med2}:`, error);
    return null;
  }
}
