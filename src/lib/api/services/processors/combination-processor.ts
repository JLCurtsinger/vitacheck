
import { InteractionResult, MedicationLookupResult } from '../../types';
import { CombinationResult } from '../combination-types';
import { processMedicationPair, createFallbackInteractionResult } from '../../utils/pair-processing';
import { processMedicationTriple } from '../../utils/triple-processing-utils';
import { validateMedicationsForProcessing } from './validation-utils';
import { processSingleMedication } from './single-processor';
import { createFallbackCombinationResult } from './fallback-processor';

/**
 * Process a single set of medications (single, pair, or triple)
 */
export async function processCombination(
  medications: string[],
  type: 'single' | 'pair' | 'triple',
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<CombinationResult> {
  // Validate medications
  const { isValid, error } = validateMedicationsForProcessing(medications, medicationStatuses);
  if (!isValid) {
    return createFallbackCombinationResult(medications, type, error);
  }
  
  try {
    let result: InteractionResult;
    
    // Process based on combination type
    if (type === 'single') {
      // For singles, we just need info about the one medication
      result = await processSingleMedication(medications[0], medicationStatuses);
    } 
    else if (type === 'pair') {
      // For pairs, we check for interactions between the two medications
      result = await processMedicationPair(medications[0], medications[1], medicationStatuses);
    } 
    else {
      // For triples, we check for interactions among three medications
      result = await processMedicationTriple(medications[0], medications[1], medications[2], medicationStatuses);
    }
    
    // Verify the result is valid
    if (!result || !result.severity || !result.sources || result.sources.length === 0) {
      console.warn(`Invalid ${type} result for ${medications.join(' + ')}, using fallback`);
      
      if (type === 'pair') {
        result = createFallbackInteractionResult(medications[0], medications[1]);
      } else {
        result = {
          medications,
          severity: "unknown",
          description: `No data available for this ${type} combination`,
          sources: [{
            name: "No Data Available",
            severity: "unknown",
            description: `No data available for this ${type} combination`
          }]
        };
      }
    }
    
    // Convert to CombinationResult
    return {
      ...result,
      type,
      label: medications.join(' + ')
    };
    
  } catch (error) {
    console.error(`Error processing ${type} combination ${medications.join(' + ')}:`, error);
    return createFallbackCombinationResult(
      medications, 
      type, 
      `Error processing ${medications.join(' + ')}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
