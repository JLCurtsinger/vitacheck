
import { supabase } from "@/integrations/supabase/client";
import { NutrientDepletion, DbResult } from "./types";
import { findOrCreateSubstance } from "./substances";
import { normalizeMedicationName } from "../utils/name-normalizer";

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
  const normalizedName = normalizeMedicationName(medicationName);
  
  const { data, error } = await supabase
    .from('nutrient_depletions')
    .select('*')
    .ilike('medication_name', normalizedName);
  
  return { data, error };
}

/**
 * Check if a nutrient depletion already exists
 * @param medicationName Medication name
 * @param depletedNutrient Nutrient being depleted
 * @returns Boolean indicating if the depletion exists
 */
export async function checkNutrientDepletionExists(
  medicationName: string,
  depletedNutrient: string
): Promise<boolean> {
  const normalizedName = normalizeMedicationName(medicationName);
  
  const { data, error } = await supabase
    .from('nutrient_depletions')
    .select('id')
    .ilike('medication_name', normalizedName)
    .eq('depleted_nutrient', depletedNutrient)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking for existing nutrient depletion:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Create a new nutrient depletion record with substance_id
 * @param depletion Nutrient depletion data
 * @returns Created nutrient depletion or error
 */
export async function createNutrientDepletion(
  depletion: Pick<NutrientDepletion, 'medication_name' | 'depleted_nutrient' | 'source'> & { substance_id?: string }
): Promise<DbResult<NutrientDepletion>> {
  const normalizedName = normalizeMedicationName(depletion.medication_name);
  
  // Check if this nutrient depletion already exists
  const exists = await checkNutrientDepletionExists(normalizedName, depletion.depleted_nutrient);
  
  if (exists) {
    console.log(`Nutrient depletion already exists for ${normalizedName} - ${depletion.depleted_nutrient}`);
    return { data: null, error: null }; // Return null without an error to indicate it was skipped
  }
  
  // If no substance_id is provided, try to find or create the substance
  let substanceId = depletion.substance_id;
  
  if (!substanceId) {
    const substance = await findOrCreateSubstance(
      normalizedName, 
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
      medication_name: normalizedName,
      depleted_nutrient: depletion.depleted_nutrient,
      source: depletion.source,
      substance_id: substanceId
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Error creating nutrient depletion:', error);
  } else {
    console.log(`Successfully created nutrient depletion for ${normalizedName} - ${depletion.depleted_nutrient}`);
  }
  
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
