
/**
 * Combination Utilities
 * 
 * Functions for generating different types of medication combinations for analysis
 */

/**
 * Generate all combination types (singles, pairs, triples) from a list of medications
 * 
 * @param medications Array of medication names
 * @returns Object containing different types of combinations
 */
export function generateAllCombinations(medications: string[]) {
  return {
    singles: generateSingleCombinations(medications),
    pairs: generatePairCombinations(medications),
    triples: medications.length >= 3 ? generateTripleCombinations(medications) : []
  };
}

/**
 * Generate single medication combinations (just the original array)
 */
export function generateSingleCombinations(medications: string[]): Array<[string]> {
  return medications.map(med => [med]);
}

/**
 * Generate all possible unique pairs of medications from an input array
 */
export function generatePairCombinations(medications: string[]): Array<[string, string]> {
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

/**
 * Generate all possible unique triples of medications from an input array
 * Limit to a maximum of 5 combinations for performance
 */
export function generateTripleCombinations(medications: string[]): Array<[string, string, string]> {
  const triples: Array<[string, string, string]> = [];
  const processedTriples = new Set<string>();
  const maxTriples = 5; // Limit for performance reasons
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      for (let k = j + 1; k < medications.length; k++) {
        if (triples.length >= maxTriples) break;
        
        const triple = [medications[i], medications[j], medications[k]].sort();
        const tripleKey = triple.join('-');
        
        if (!processedTriples.has(tripleKey)) {
          processedTriples.add(tripleKey);
          triples.push([medications[i], medications[j], medications[k]]);
        }
      }
    }
  }
  
  return triples;
}
