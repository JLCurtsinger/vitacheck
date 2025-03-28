
import { dbService } from "@/lib/api/services/db-service";

/**
 * This is a manual test file to verify the database schema
 * It can be run in the browser console for debugging
 */
export async function testDbSchema() {
  console.log('Running database schema tests...');
  
  try {
    // Test creating a substance
    console.log('Testing substance creation...');
    const substance = await dbService.findOrCreateSubstance('Ibuprofen', 'medication', 'User');
    console.log('Created substance:', substance);
    
    if (!substance) {
      throw new Error('Failed to create substance');
    }
    
    // Test creating another substance
    const substance2 = await dbService.findOrCreateSubstance('Acetaminophen', 'medication', 'User');
    console.log('Created second substance:', substance2);
    
    if (!substance2) {
      throw new Error('Failed to create second substance');
    }
    
    // Test creating an interaction
    console.log('Testing interaction creation...');
    const interaction = await dbService.findOrCreateInteractionByNames('Ibuprofen', 'Acetaminophen');
    console.log('Created interaction:', interaction);
    
    if (!interaction) {
      throw new Error('Failed to create interaction');
    }
    
    // Test getting interactions for a substance
    console.log('Testing getting interactions...');
    const { data: interactions } = await dbService.getInteractionsBySubstanceId(substance.id);
    console.log('Got interactions:', interactions);
    
    // Test comprehensive medication lookup
    console.log('Testing comprehensive medication lookup...');
    const medicationDetails = await dbService.getMedicationDetails('Ibuprofen');
    console.log('Got medication details:', medicationDetails);
    
    console.log('All tests passed!');
    return true;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Make the test function available in the global scope for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testDbSchema = testDbSchema;
}
