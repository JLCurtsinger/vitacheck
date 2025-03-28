
import { MedicationLookupResult } from '../../types';

/**
 * Validates that a set of medications can be processed
 */
export function validateMedicationsForProcessing(
  medications: string[],
  medicationStatuses: Map<string, MedicationLookupResult>
): { isValid: boolean; error?: string } {
  // Return early if no medications
  if (!medications || medications.length === 0) {
    return { 
      isValid: false, 
      error: "No medications provided" 
    };
  }
  
  // Verify all medications have status
  for (const med of medications) {
    const status = medicationStatuses.get(med);
    if (!status) {
      return { 
        isValid: false, 
        error: `Medication status not found for ${med}` 
      };
    }
    
    if (status.status !== 'found') {
      return { 
        isValid: false, 
        error: `Medication ${med} not found in available databases` 
      };
    }
  }
  
  return { isValid: true };
}
