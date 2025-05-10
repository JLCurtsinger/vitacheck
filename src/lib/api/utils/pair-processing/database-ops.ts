
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
    const { data: substances, error: substancesError } = await supabase
      .from('substances')
      .select('id')
      .in('name', [med1.toLowerCase(), med2.toLowerCase()]);
      
    if (substancesError || !substances || substances.length < 2) {
      console.log(`No substances found for ${med1} and/or ${med2}`);
      return null;
    }
    
    // Find interaction between these substances
    const { data: interactions, error: interactionsError } = await supabase
      .from('interactions')
      .select('id, severity, confidence_level, sources, last_checked')
      .or(`substance_a_id.eq.${substances[0].id},substance_a_id.eq.${substances[1].id}`)
      .or(`substance_b_id.eq.${substances[0].id},substance_b_id.eq.${substances[1].id}`);
      
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
