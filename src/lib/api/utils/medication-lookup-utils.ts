
import { MedicationLookupResult } from '../types';
import { lookupMedication } from '../services/medication-lookup';

// Session-level medication lookup cache
const medicationLookupCache = new Map<string, MedicationLookupResult>();

export async function processMedicationLookups(medications: string[]): Promise<Map<string, MedicationLookupResult>> {
  const medicationStatuses = new Map<string, MedicationLookupResult>();
  
  for (const med of medications) {
    // Check if this medication is already in the cache
    if (medicationLookupCache.has(med)) {
      console.log(`Using cached lookup data for: ${med}`);
      medicationStatuses.set(med, medicationLookupCache.get(med)!);
    } else {
      // If not in cache, perform the lookup
      const result = await lookupMedication(med);
      // Store result in both the local map and the cache
      medicationStatuses.set(med, result);
      medicationLookupCache.set(med, result);
    }
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
