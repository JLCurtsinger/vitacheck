
/**
 * Medication Pair Generation Utilities
 * 
 * This module handles the generation of unique medication pairs for interaction checking.
 */

/**
 * Generates all possible unique pairs of medications from an input array
 * @param medications - Array of medication names to generate pairs from
 * @returns Array of medication name pairs
 */
export function generateMedicationPairs(medications: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const processedPairs = new Set<string>();
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const pair = [medications[i], medications[j]].sort();
      const pairKey = pair.join('-');
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        pairs.push([medications[i], medications[j]]);
      }
    }
  }
  
  return pairs;
}
