import { supabase } from "@/integrations/supabase/client";
import { Interaction, DbResult } from "./types";
import { findOrCreateSubstance } from "./substances";
import { normalizeMedicationName } from "../utils/name-normalizer";

/**
 * Get an interaction between two substances by their IDs
 * @param substanceAId First substance ID
 * @param substanceBId Second substance ID
 * @returns Interaction data or null if not found
 */
export async function getInteractionBySubstanceIds(
  substanceAId: string,
  substanceBId: string
): Promise<DbResult<Interaction>> {
  // Ensure substance_a_id < substance_b_id per our constraint
  const [firstId, secondId] = substanceAId < substanceBId
    ? [substanceAId, substanceBId]
    : [substanceBId, substanceAId];
  
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('substance_a_id', firstId)
    .eq('substance_b_id', secondId)
    .maybeSingle();
  
  return { data, error };
}

/**
 * Get all interactions for a given substance
 * @param substanceId Substance ID
 * @returns Array of interactions involving the substance
 */
export async function getInteractionsBySubstanceId(
  substanceId: string
): Promise<DbResult<Interaction[]>> {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .or(`substance_a_id.eq.${substanceId},substance_b_id.eq.${substanceId}`);
  
  return { data, error };
}

/**
 * Create a new interaction record or update if it already exists
 * @param interaction Interaction data to create or update
 * @returns Created/Updated interaction or error
 */
export async function createOrUpdateInteraction(
  interaction: Omit<Interaction, 'id' | 'first_detected' | 'updated_at'>
): Promise<DbResult<Interaction>> {
  // Ensure substance_a_id < substance_b_id per our constraint
  const [substanceAId, substanceBId] = interaction.substance_a_id < interaction.substance_b_id
    ? [interaction.substance_a_id, interaction.substance_b_id]
    : [interaction.substance_b_id, interaction.substance_a_id];
  
  // Check if the interaction already exists
  const { data: existingInteraction } = await getInteractionBySubstanceIds(
    substanceAId,
    substanceBId
  );
  
  if (existingInteraction) {
    // Update the existing interaction
    console.log(`Updating existing interaction between substance IDs: ${substanceAId} and ${substanceBId}`);
    
    const { data, error } = await supabase
      .from('interactions')
      .update({
        interaction_detected: interaction.interaction_detected,
        severity: interaction.severity,
        risk_score: interaction.risk_score,
        confidence_level: interaction.confidence_level,
        sources: interaction.sources,
        api_responses: interaction.api_responses,
        notes: interaction.notes,
        flagged_by_user: interaction.flagged_by_user,
        last_checked: new Date().toISOString()
      })
      .eq('id', existingInteraction.id)
      .select()
      .maybeSingle();
    
    if (error) {
      console.error('Error updating interaction:', error);
    }
    
    return { data, error };
  }
  
  // Create a new interaction if it doesn't exist
  console.log(`Creating new interaction between substance IDs: ${substanceAId} and ${substanceBId}`);
  
  const { data, error } = await supabase
    .from('interactions')
    .insert({
      substance_a_id: substanceAId,
      substance_b_id: substanceBId,
      interaction_detected: interaction.interaction_detected,
      severity: interaction.severity,
      risk_score: interaction.risk_score,
      confidence_level: interaction.confidence_level,
      sources: interaction.sources,
      api_responses: interaction.api_responses,
      notes: interaction.notes,
      flagged_by_user: interaction.flagged_by_user
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error('Error creating interaction:', error);
  } else {
    console.log('Successfully created new interaction:', data);
  }
  
  return { data, error };
}

/**
 * Find or create an interaction between two substances by their names
 * @param medicationA First medication name
 * @param medicationB Second medication name
 * @returns Interaction data
 */
export async function findOrCreateInteractionByNames(
  medicationA: string,
  medicationB: string
): Promise<Interaction | null> {
  // Normalize medication names
  const normalizedMedA = normalizeMedicationName(medicationA);
  const normalizedMedB = normalizeMedicationName(medicationB);
  
  if (!normalizedMedA || !normalizedMedB) {
    console.error('Cannot find or create interaction: medication name(s) are empty after normalization');
    return null;
  }
  
  // Find or create the substances
  const substanceA = await findOrCreateSubstance(normalizedMedA);
  const substanceB = await findOrCreateSubstance(normalizedMedB);
  
  if (!substanceA || !substanceB) {
    console.error('Could not find or create substances for interaction');
    return null;
  }
  
  // Get the interaction if it exists
  const { data: existingInteraction } = await getInteractionBySubstanceIds(
    substanceA.id,
    substanceB.id
  );
  
  if (existingInteraction) {
    console.log(`Found existing interaction between ${normalizedMedA} and ${normalizedMedB}`);
    return existingInteraction;
  }
  
  // Create a new interaction if it doesn't exist
  console.log(`Creating new interaction between ${normalizedMedA} and ${normalizedMedB}`);
  
  const { data: newInteraction, error } = await createOrUpdateInteraction({
    substance_a_id: substanceA.id < substanceB.id ? substanceA.id : substanceB.id,
    substance_b_id: substanceA.id < substanceB.id ? substanceB.id : substanceA.id,
    interaction_detected: false // Default until we detect an interaction
  });
  
  if (error) {
    console.error('Error creating interaction:', error);
    return null;
  }
  
  console.log('Successfully created new interaction');
  return newInteraction;
}
