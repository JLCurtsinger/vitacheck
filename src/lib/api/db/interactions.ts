
import { supabase } from "@/integrations/supabase/client";
import { Interaction, DbResult } from "./types";
import { findOrCreateSubstance } from "./substances";

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
 * Create a new interaction record
 * @param interaction Interaction data to create
 * @returns Created interaction or error
 */
export async function createInteraction(
  interaction: Omit<Interaction, 'id' | 'first_detected' | 'last_checked' | 'updated_at'>
): Promise<DbResult<Interaction>> {
  // Ensure substance_a_id < substance_b_id per our constraint
  const [substanceAId, substanceBId] = interaction.substance_a_id < interaction.substance_b_id
    ? [interaction.substance_a_id, interaction.substance_b_id]
    : [interaction.substance_b_id, interaction.substance_a_id];
  
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
  // Find or create the substances
  const substanceA = await findOrCreateSubstance(medicationA);
  const substanceB = await findOrCreateSubstance(medicationB);
  
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
    return existingInteraction;
  }
  
  // Create a new interaction if it doesn't exist
  const { data: newInteraction, error } = await createInteraction({
    substance_a_id: substanceA.id < substanceB.id ? substanceA.id : substanceB.id,
    substance_b_id: substanceA.id < substanceB.id ? substanceB.id : substanceA.id,
    interaction_detected: false // Default until we detect an interaction
  });
  
  if (error) {
    console.error('Error creating interaction:', error);
    return null;
  }
  
  return newInteraction;
}
