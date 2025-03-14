
import { MedicationLookupResult } from '../types';
import { lookupMedication } from '../services/medication-lookup';

export async function processMedicationLookups(medications: string[]): Promise<Map<string, MedicationLookupResult>> {
  const medicationStatuses = new Map<string, MedicationLookupResult>();
  
  for (const med of medications) {
    medicationStatuses.set(med, await lookupMedication(med));
  }
  
  return medicationStatuses;
}

export function validateMedicationPair(
  med1: string,
  med2: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): { isValid: boolean; error?: string } {
  const med1Status = medicationStatuses.get(med1);
  const med2Status = medicationStatuses.get(med2);
  
  if (!med1Status || !med2Status) {
    return { 
      isValid: false, 
      error: 'Medication status not found' 
    };
  }
  
  if (med1Status.status !== 'found' || med2Status.status !== 'found') {
    return { 
      isValid: false, 
      error: 'One or more medications not found in available databases' 
    };
  }
  
  return { isValid: true };
}
