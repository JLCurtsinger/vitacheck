
import { InteractionResult, MedicationLookupResult, InteractionSource } from '../types';
import { processMedicationLookups, validateMedicationPair } from '../utils/medication-lookup-utils';
import { processMedicationPair, createFallbackInteractionResult } from '../utils/pair-processing-utils';
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
 * Creates a fallback combination result
 */
function createFallbackCombinationResult(
  medications: string[],
  type: 'single' | 'pair' | 'triple',
  error?: string
): CombinationResult {
  const label = medications.join(' + ');
  const description = error || `No data available for this ${type} combination.`;
  
  return {
    medications,
    severity: "unknown",
    description,
    sources: [{
      name: "No data available",
      severity: "unknown",
      description
    }],
    type,
    label
  };
}

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
        const result = await processSingleMedication(med, medicationStatuses);
        results.push({
          ...result,
          type: 'single',
          label: med
        });
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
            }],
            type: 'pair',
            label: `${med1} + ${med2}`
          });
          continue;
        }
        
        const pairResult = await processMedicationPair(med1, med2, medicationStatuses);
        
        // Verify the pair result is valid
        if (!pairResult || !pairResult.severity || !pairResult.sources || pairResult.sources.length === 0) {
          console.warn(`Invalid pair result for ${med1} + ${med2}, using fallback`);
          const fallback = createFallbackInteractionResult(med1, med2);
          results.push({
            ...fallback,
            type: 'pair',
            label: `${med1} + ${med2}`
          });
        } else {
          results.push({
            ...pairResult,
            type: 'pair',
            label: `${med1} + ${med2}`
          });
        }
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
        const tripleResult = await processMedicationTriple(med1, med2, med3, medicationStatuses);
        
        // Verify the triple result is valid
        if (!tripleResult || !tripleResult.severity || !tripleResult.sources || tripleResult.sources.length === 0) {
          console.warn(`Invalid triple result for ${med1} + ${med2} + ${med3}, using fallback`);
          results.push(createFallbackCombinationResult([med1, med2, med3], 'triple'));
        } else {
          results.push({
            ...tripleResult,
            type: 'triple',
            label: `${med1} + ${med2} + ${med3}`
          });
        }
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

/**
 * Process a single medication for adverse events and warnings
 */
async function processSingleMedication(
  medication: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  const medStatus = medicationStatuses.get(medication);
  
  if (!medStatus) {
    console.warn(`Medication status not found for ${medication}`);
    return {
      medications: [medication],
      severity: "unknown",
      description: "Medication information not found",
      sources: [{
        name: "No data available",
        severity: "unknown",
        description: "Medication information not found"
      }]
    };
  }
  
  // For single medications, we just use the warnings as sources
  const sources: InteractionSource[] = medStatus.warnings && medStatus.warnings.length > 0 
    ? medStatus.warnings.map(warning => ({
        name: "FDA Warnings",
        severity: "minor" as const,
        description: warning
      })) 
    : [{
        name: "FDA Information",
        severity: "unknown" as const,
        description: "No specific warnings found for this medication"
      }];
  
  // Ensure sources array is not empty
  if (sources.length === 0) {
    sources.push({
      name: "No Data Available",
      severity: "unknown" as const,
      description: "No information available for this medication"
    });
  }
  
  return {
    medications: [medication],
    severity: sources[0].severity,
    description: `Information about ${medication}`,
    sources
  };
}
