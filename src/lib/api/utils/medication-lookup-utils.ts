
import { MedicationLookupResult } from '../types';
import { lookupMedication } from '../services/medication-lookup';

// Session-level medication lookup cache
const medicationLookupCache = new Map<string, MedicationLookupResult>();

export async function processMedicationLookups(medications: string[]): Promise<Map<string, MedicationLookupResult>> {
  const medicationStatuses = new Map<string, MedicationLookupResult>();
  
  // Build lookup promises for all medications (cached or not)
  // This preserves the order of the original medications array
  const lookupPromises = medications.map(async (med) => {
    // Check if this medication is already in the cache
    if (medicationLookupCache.has(med)) {
      console.log(`Using cached lookup data for: ${med}`);
      return { med, result: medicationLookupCache.get(med)! };
    } else {
      // If not in cache, perform the lookup
      console.log(`Starting parallel lookup for: ${med}`);
      const result = await lookupMedication(med);
      // Store result in cache
      medicationLookupCache.set(med, result);
      return { med, result };
    }
  });
  
  // Wait for all lookups to complete (cached lookups resolve immediately)
  const lookupResults = await Promise.all(lookupPromises);
  
  // Add results to the map in the original medications array order
  for (const { med, result } of lookupResults) {
    medicationStatuses.set(med, result);
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
