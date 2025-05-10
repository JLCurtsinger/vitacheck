
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
