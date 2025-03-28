
import { InteractionResult, MedicationLookupResult } from '../types';
import { processMedicationLookups } from '../utils/medication-lookup-utils';
import { CombinationResult } from './combination-types';
import { processCombination } from './processors/combination-processor';
import { createFallbackCombinationResult } from './processors/fallback-processor';
import { 
  generateSingleCombinations, 
  generatePairCombinations, 
  generateTripleCombinations 
} from '../../utils/combination-utils';

/**
 * Check all possible combinations of medications (singles, pairs, triples)
 * 
 * @param medications Array of medication names
 * @returns Array of results for different combination types
 */
export async function checkAllCombinations(medications: string[]): Promise<CombinationResult[]> {
  console.log(`Starting checkAllCombinations for ${medications.length} medications:`, medications);
  
  const results: CombinationResult[] = [];
  
  // Return early if no medications
  if (!medications || medications.length === 0) {
    console.warn("No medications provided to checkAllCombinations");
    return results;
  }
  
  try {
    // Process all medication lookups once
    const medicationStatuses = await processMedicationLookups(medications);
    
    // Generate all needed combinations
    const singles = generateSingleCombinations(medications);
    const pairs = generatePairCombinations(medications);
    const triples = medications.length >= 3 ? generateTripleCombinations(medications) : [];
    
    console.log(`Generated combinations: ${singles.length} singles, ${pairs.length} pairs, ${triples.length} triples`);
    
    // Process single medications
    for (const [med] of singles) {
      try {
        const result = await processCombination([med], 'single', medicationStatuses);
        results.push(result);
      } catch (error) {
        console.error(`Error processing single medication ${med}:`, error);
        results.push(createFallbackCombinationResult([med], 'single', 
          `Error processing ${med}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
    
    console.log(`Processed ${singles.length} single medications`);
    
    // Process medication pairs
    for (const [med1, med2] of pairs) {
      try {
        const result = await processCombination([med1, med2], 'pair', medicationStatuses);
        results.push(result);
      } catch (error) {
        console.error(`Error processing medication pair ${med1} + ${med2}:`, error);
        results.push(createFallbackCombinationResult([med1, med2], 'pair', 
          `Error processing ${med1} + ${med2}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
    
    console.log(`Processed ${pairs.length} medication pairs`);
    
    // Process medication triples if available
    for (const [med1, med2, med3] of triples) {
      try {
        const result = await processCombination([med1, med2, med3], 'triple', medicationStatuses);
        results.push(result);
      } catch (error) {
        console.error(`Error processing medication triple ${med1} + ${med2} + ${med3}:`, error);
        results.push(createFallbackCombinationResult([med1, med2, med3], 'triple', 
          `Error processing ${med1} + ${med2} + ${med3}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    }
    
    console.log(`Processed ${triples.length} medication triples`);
    
    // Filter out any invalid results
    const validResults = results.filter(result => 
      result && result.severity !== undefined && result.sources && result.sources.length > 0);
    
    console.log(`Filtered ${results.length} total results to ${validResults.length} valid results`);
    
    if (validResults.length === 0 && results.length > 0) {
      console.warn("All results were filtered out as invalid, returning original results with warning");
      return results;
    }
    
    return validResults;
  } catch (error) {
    console.error("Error in checkAllCombinations:", error);
    // Create an appropriate fallback based on the number of medications
    if (medications.length === 1) {
      return [createFallbackCombinationResult([medications[0]], 'single')];
    } else if (medications.length === 2) {
      return [createFallbackCombinationResult([medications[0], medications[1]], 'pair')];
    } else {
      return [
        ...medications.map(med => createFallbackCombinationResult([med], 'single')),
        ...generatePairCombinations(medications).map(pair => 
          createFallbackCombinationResult(pair, 'pair')
        )
      ];
    }
  }
}
