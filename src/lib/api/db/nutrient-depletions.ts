
import { supabase } from "@/integrations/supabase/client";
import { NutrientDepletion, DbResult } from "./types";
import { findOrCreateSubstance } from "./substances";

/**
 * Get nutrient depletions for a substance by its ID
 * @param substanceId Substance ID
 * @returns Array of nutrient depletions for the substance
 */
export async function getNutrientDepletionsBySubstanceId(
  substanceId: string
): Promise<DbResult<NutrientDepletion[]>> {
  const { data, error } = await supabase
    .from('nutrient_depletions')
    .select('*')
    .eq('substance_id', substanceId);
  
  return { data, error };
}

/**
 * Get nutrient depletions for a medication by name
 * @param medicationName Medication name
 * @returns Array of nutrient depletions for the medication
 */
export async function getNutrientDepletionsByMedicationName(
  medicationName: string
): Promise<DbResult<NutrientDepletion[]>> {
  const { data, error } = await supabase
    .from('nutrient_depletions')
    .select('*')
    .ilike('medication_name', medicationName);
  
  return { data, error };
}

/**
 * Create a new nutrient depletion record with substance_id
 * @param depletion Nutrient depletion data
 * @returns Created nutrient depletion or error
 */
export async function createNutrientDepletion(
  depletion: Pick<NutrientDepletion, 'medication_name' | 'depleted_nutrient' | 'source'> & { substance_id?: string }
): Promise<DbResult<NutrientDepletion>> {
  // If no substance_id is provided, try to find or create the substance
  let substanceId = depletion.substance_id;
  
  if (!substanceId) {
    const substance = await findOrCreateSubstance(
      depletion.medication_name, 
      'medication',
      'User'
    );
    
    if (substance) {
      substanceId = substance.id;
    }
  }
  
  const { data, error } = await supabase
    .from('nutrient_depletions')
    .insert({
      medication_name: depletion.medication_name.toLowerCase(),
      depleted_nutrient: depletion.depleted_nutrient,
      source: depletion.source,
      substance_id: substanceId
    })
    .select()
    .maybeSingle();
  
  return { data, error };
}

/**
 * Link existing nutrient depletions to substances
 * This function can be used to update existing records
 * to associate them with substances in the new schema
 */
export async function linkNutrientDepletionsToSubstances(): Promise<void> {
  // Get all nutrient depletions without a substance_id
  const { data: depletions, error } = await supabase
    .from('nutrient_depletions')
    .select('*')
    .is('substance_id', null);
  
  if (error || !depletions) {
    console.error('Error fetching nutrient depletions:', error);
    return;
  }
  
  // Process each depletion to link it to a substance
  for (const depletion of depletions) {
    const substance = await findOrCreateSubstance(
      depletion.medication_name,
      'medication',
      'User'
    );
    
    if (substance) {
      // Update the depletion record with the substance_id
      const { error: updateError } = await supabase
        .from('nutrient_depletions')
        .update({ substance_id: substance.id })
        .eq('id', depletion.id);
      
      if (updateError) {
        console.error(`Error updating nutrient depletion ${depletion.id}:`, updateError);
      }
    }
  }
}
