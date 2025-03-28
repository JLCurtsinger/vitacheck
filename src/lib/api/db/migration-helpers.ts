
import { supabase } from "@/integrations/supabase/client";
import { findOrCreateSubstance } from "./substances";
import { findOrCreateInteractionByNames } from "./interactions";
import { getNutrientDepletionsByMedicationName } from "./nutrient-depletions";
import { InteractionResult } from "@/lib/api/types";

/**
 * Imports an InteractionResult into the new database schema
 * @param interaction The interaction result to import
 */
export async function importInteractionResult(interaction: InteractionResult): Promise<void> {
  if (!interaction || !interaction.medications || interaction.medications.length < 2) {
    console.error('Invalid interaction data for import');
    return;
  }
  
  try {
    // Always work with the first two medications (pair-wise interactions)
    const medicationA = interaction.medications[0];
    const medicationB = interaction.medications[1];
    
    // Find or create the interaction in the database
    const dbInteraction = await findOrCreateInteractionByNames(medicationA, medicationB);
    
    if (!dbInteraction) {
      console.error('Failed to create interaction in database');
      return;
    }
    
    // Update the interaction with data from the InteractionResult
    const { error } = await supabase
      .from('interactions')
      .update({
        interaction_detected: interaction.severity !== 'unknown' && interaction.severity !== 'safe',
        severity: interaction.severity,
        risk_score: interaction.confidenceScore ? interaction.confidenceScore / 100 : null, // Convert to 0-1 scale
        confidence_level: interaction.confidenceScore ? interaction.confidenceScore / 100 : null,
        sources: interaction.sources ? interaction.sources.map(s => s.name) : null,
        api_responses: interaction.sources ? { sources: interaction.sources } : null,
        notes: interaction.description || null,
        last_checked: new Date().toISOString()
      })
      .eq('id', dbInteraction.id);
    
    if (error) {
      console.error('Error updating interaction:', error);
    }
  } catch (error) {
    console.error('Error importing interaction:', error);
  }
}

/**
 * Links existing nutrient depletions to substances
 */
export async function migrateNutrientDepletions(): Promise<void> {
  // Get all distinct medication names from nutrient_depletions
  const { data: medications, error } = await supabase
    .from('nutrient_depletions')
    .select('medication_name')
    .is('substance_id', null);
  
  if (error || !medications) {
    console.error('Error fetching medications:', error);
    return;
  }
  
  // Deduplicate medication names
  const uniqueMedicationNames = [...new Set(medications.map(m => m.medication_name))];
  
  console.log(`Found ${uniqueMedicationNames.length} unique medications to migrate`);
  
  // Process each medication
  let processed = 0;
  for (const medicationName of uniqueMedicationNames) {
    try {
      // Find or create the substance
      const substance = await findOrCreateSubstance(
        medicationName,
        'medication',
        'User'
      );
      
      if (substance) {
        // Get all depletions for this medication
        const { data: depletions } = await getNutrientDepletionsByMedicationName(medicationName);
        
        if (depletions && depletions.length > 0) {
          // Update each depletion record with the substance_id
          for (const depletion of depletions) {
            const { error: updateError } = await supabase
              .from('nutrient_depletions')
              .update({ substance_id: substance.id })
              .eq('id', depletion.id);
            
            if (updateError) {
              console.error(`Error updating depletion ${depletion.id}:`, updateError);
            }
          }
        }
      }
      
      processed++;
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${uniqueMedicationNames.length} medications`);
      }
    } catch (error) {
      console.error(`Error processing medication ${medicationName}:`, error);
    }
  }
  
  console.log(`Migration completed: ${processed}/${uniqueMedicationNames.length} medications processed`);
}
