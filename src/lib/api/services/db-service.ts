
import { findOrCreateSubstance, getSubstanceByName, getSubstances } from "../db/substances";
import { findOrCreateInteractionByNames, getInteractionsBySubstanceId } from "../db/interactions";
import { getNutrientDepletionsByMedicationName, getNutrientDepletionsBySubstanceId, createNutrientDepletion } from "../db/nutrient-depletions";
import { importInteractionResult, migrateNutrientDepletions } from "../db/migration-helpers";
import { normalizeMedicationName } from "../utils/name-normalizer";

/**
 * Database service for VitaCheck
 * Provides a unified interface for accessing the database
 */
export const dbService = {
  // Substance-related functions
  findOrCreateSubstance,
  getSubstanceByName,
  getSubstances,
  
  // Interaction-related functions
  findOrCreateInteractionByNames,
  getInteractionsBySubstanceId,
  
  // Nutrient depletion-related functions
  getNutrientDepletionsByMedicationName,
  getNutrientDepletionsBySubstanceId,
  createNutrientDepletion,
  
  // Migration helpers
  importInteractionResult,
  migrateNutrientDepletions,
  
  // Name normalization utility
  normalizeMedicationName,
  
  /**
   * Comprehensive lookup for a medication
   * Returns all related data from substances, interactions, and nutrient depletions
   */
  async getMedicationDetails(medicationName: string) {
    // Normalize the medication name for consistent lookups
    const normalizedName = normalizeMedicationName(medicationName);
    
    // First find or create the substance
    const substance = await findOrCreateSubstance(normalizedName);
    
    if (!substance) {
      console.error(`Could not find or create substance for: ${normalizedName}`);
      return null;
    }
    
    // Get related data
    const [interactions, depletions] = await Promise.all([
      getInteractionsBySubstanceId(substance.id).then(result => result.data || []),
      getNutrientDepletionsBySubstanceId(substance.id).then(result => result.data || [])
    ]);
    
    return {
      substance,
      interactions,
      depletions
    };
  }
};

// Export types for consistency
export * from "../db/types";
