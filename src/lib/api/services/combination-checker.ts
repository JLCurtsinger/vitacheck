
import { InteractionResult, MedicationLookupResult, InteractionSource } from '../types';
import { processMedicationLookups, validateMedicationPair } from '../utils/medication-lookup-utils';
import { processMedicationPair } from '../utils/pair-processing-utils';
import { processMedicationTriple } from '../utils/triple-processing-utils';
import { 
  generateSingleCombinations, 
  generatePairCombinations, 
  generateTripleCombinations 
} from '../../utils/combination-utils';

export interface CombinationResult extends InteractionResult {
  type: 'single' | 'pair' | 'triple';
  label: string;
}

/**
 * Check all possible combinations of medications (singles, pairs, triples)
 * 
 * @param medications Array of medication names
 * @returns Array of results for different combination types
 */
export async function checkAllCombinations(medications: string[]): Promise<CombinationResult[]> {
  const results: CombinationResult[] = [];
  
  // Process all medication lookups once
  const medicationStatuses = await processMedicationLookups(medications);
  
  // Generate all needed combinations
  const singles = generateSingleCombinations(medications);
  const pairs = generatePairCombinations(medications);
  const triples = medications.length >= 3 ? generateTripleCombinations(medications) : [];
  
  // Process single medications
  for (const [med] of singles) {
    const result = await processSingleMedication(med, medicationStatuses);
    results.push({
      ...result,
      type: 'single',
      label: med
    });
  }
  
  // Process medication pairs
  for (const [med1, med2] of pairs) {
    const { isValid, error } = validateMedicationPair(med1, med2, medicationStatuses);
    
    if (!isValid) {
      results.push({
        medications: [med1, med2],
        severity: "unknown" as const,
        description: error || "Unknown error occurred",
        sources: [{
          name: "No data available",
          severity: "unknown" as const,
          description: error || "Unknown error occurred"
        }],
        type: 'pair',
        label: `${med1} + ${med2}`
      });
      continue;
    }
    
    const result = await processMedicationPair(med1, med2, medicationStatuses);
    results.push({
      ...result,
      type: 'pair',
      label: `${med1} + ${med2}`
    });
  }
  
  // Process medication triples if available
  for (const [med1, med2, med3] of triples) {
    // Similar validation could be added here
    const result = await processMedicationTriple(med1, med2, med3, medicationStatuses);
    results.push({
      ...result,
      type: 'triple',
      label: `${med1} + ${med2} + ${med3}`
    });
  }
  
  // Sort results by type (triple > pair > single) and then by severity
  // Note: The sorting will be performed in the useInteractions hook to allow
  // for more flexible sorting based on UI context
  
  return results;
}

/**
 * Process a single medication for adverse events and warnings
 */
async function processSingleMedication(
  medication: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  const medStatus = medicationStatuses.get(medication);
  
  if (!medStatus) {
    return {
      medications: [medication],
      severity: "unknown" as const,
      description: "Medication information not found",
      sources: [{
        name: "No data available",
        severity: "unknown" as const,
        description: "Medication information not found"
      }]
    };
  }
  
  // For single medications, we just use the warnings as sources
  const sources: InteractionSource[] = medStatus.warnings ? medStatus.warnings.map(warning => ({
    name: "FDA Warnings",
    severity: "minor" as const,
    description: warning
  })) : [{
    name: "FDA Information",
    severity: "unknown" as const,
    description: "No specific warnings found for this medication"
  }];
  
  return {
    medications: [medication],
    severity: sources[0].severity,
    description: "Information about single medication",
    sources
  };
}
