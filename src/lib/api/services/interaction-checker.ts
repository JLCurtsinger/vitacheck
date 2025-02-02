import { InteractionResult } from '../types';
import { processMedicationLookups, validateMedicationPair } from '../utils/medication-lookup-utils';
import { generateMedicationPairs, processMedicationPair } from '../utils/pair-processing-utils';

export async function checkInteractions(medications: string[]): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  
  // Process all medication lookups
  const medicationStatuses = await processMedicationLookups(medications);
  
  // Generate all possible medication pairs
  const medicationPairs = generateMedicationPairs(medications);
  
  // Process each pair
  for (const [med1, med2] of medicationPairs) {
    const { isValid, error } = validateMedicationPair(med1, med2, medicationStatuses);
    
    if (!isValid) {
      results.push({
        medications: [med1, med2],
        severity: "unknown",
        description: error || "Unknown error occurred",
        sources: [{
          name: "No data available",
          severity: "unknown",
          description: error || "Unknown error occurred"
        }]
      });
      continue;
    }
    
    const result = await processMedicationPair(med1, med2, medicationStatuses);
    results.push(result);
  }
  
  return results;
}