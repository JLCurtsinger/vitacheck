
import { migrateNutrientDepletions } from "@/lib/api/db/migration-helpers";
import { normalizeMedicationName } from "@/lib/api/utils/name-normalizer";

/**
 * This script can be run to migrate existing data to the new schema
 */
async function runMigration() {
  console.log('Starting data migration...');
  
  try {
    // Migrate nutrient depletions to link to substances
    console.log('Migrating nutrient depletions...');
    await migrateNutrientDepletions();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

/**
 * Normalize all medication names in the database
 * This is a one-time migration to ensure consistent naming
 */
async function normalizeNames() {
  console.log('Starting medication name normalization...');
  
  try {
    // Import needed services here
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Normalize names in nutrient_depletions table
    console.log('Normalizing nutrient_depletions names...');
    
    const { data: depletions, error: depletionsError } = await supabase
      .from('nutrient_depletions')
      .select('id, medication_name');
      
    if (depletionsError) {
      throw new Error(`Error fetching nutrient depletions: ${depletionsError.message}`);
    }
    
    console.log(`Found ${depletions.length} nutrient depletions to normalize`);
    
    for (const depletion of depletions) {
      const normalizedName = normalizeMedicationName(depletion.medication_name);
      
      if (normalizedName !== depletion.medication_name) {
        console.log(`Normalizing: "${depletion.medication_name}" → "${normalizedName}"`);
        
        const { error: updateError } = await supabase
          .from('nutrient_depletions')
          .update({ medication_name: normalizedName })
          .eq('id', depletion.id);
          
        if (updateError) {
          console.error(`Error updating nutrient depletion ${depletion.id}:`, updateError);
        }
      }
    }
    
    // Normalize substances table names
    console.log('Normalizing substances names...');
    
    const { data: substances, error: substancesError } = await supabase
      .from('substances')
      .select('id, name');
      
    if (substancesError) {
      throw new Error(`Error fetching substances: ${substancesError.message}`);
    }
    
    console.log(`Found ${substances.length} substances to normalize`);
    
    for (const substance of substances) {
      const normalizedName = normalizeMedicationName(substance.name);
      
      if (normalizedName !== substance.name) {
        console.log(`Normalizing: "${substance.name}" → "${normalizedName}"`);
        
        const { error: updateError } = await supabase
          .from('substances')
          .update({ name: normalizedName })
          .eq('id', substance.id);
          
        if (updateError) {
          console.error(`Error updating substance ${substance.id}:`, updateError);
        }
      }
    }
    
    console.log('Name normalization completed successfully!');
  } catch (error) {
    console.error('Name normalization failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  normalizeNames()
    .then(() => runMigration())
    .catch(console.error);
}

export { runMigration, normalizeNames };
