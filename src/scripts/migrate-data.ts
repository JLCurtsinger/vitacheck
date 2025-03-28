
import { migrateNutrientDepletions } from "@/lib/api/db/migration-helpers";

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

// Only run if this file is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}

export { runMigration };
