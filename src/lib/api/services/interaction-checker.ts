
import { InteractionResult } from '../types';
import { checkAllCombinations } from './combination-checker';

// Use export type for re-exporting types when isolatedModules is enabled
export type { CombinationResult } from './combination-types';

/**
 * Enhanced interaction checker that processes single, pair, and triple combinations
 * 
 * @param medications Array of medication names
 * @returns Array of interaction results for all combinations
 */
export async function checkInteractions(medications: string[]): Promise<InteractionResult[]> {
  // For backward compatibility, we convert the new combination results
  // back to the original InteractionResult format
  const combinationResults = await checkAllCombinations(medications);
  
  // Return all results (singles, pairs, triples) with type information
  return combinationResults;
}

// Export the more detailed function
export { checkAllCombinations };
