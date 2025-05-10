
import { MedicationLookupResult } from '../types';
import { getRxCUI } from '../rxnorm';
import { getFDAWarnings } from '../fda';

/**
 * Creates a default MedicationLookupResult object
 */
export function createDefaultMedicationLookup(name: string): MedicationLookupResult {
  return {
    name,
    status: 'unknown',
    source: 'Unknown',
    id: null,
    warnings: []
  };
}

/**
 * Creates a not found MedicationLookupResult object
 */
export function createNotFoundMedicationLookup(name: string): MedicationLookupResult {
  return {
    name,
    status: 'inactive',
    source: 'Unknown',
    id: null,
    warnings: []
  };
}

/**
 * Looks up a medication in RxNorm
 */
export async function lookupRxNormMedication(name: string): Promise<MedicationLookupResult> {
  try {
    const response = await getRxCUI(name);
    
    // Add null check for response
    if (response && typeof response === 'object' && response.data?.idGroup?.rxnormId?.length > 0) {
      const rxcui = response.data.idGroup.rxnormId[0];
      
      return {
        name,
        status: 'active',
        source: 'RxNorm',
        id: rxcui,
        warnings: []
      };
    } else {
      return createNotFoundMedicationLookup(name);
    }
  } catch (error) {
    console.error('Error looking up RxNorm medication:', error);
    return createNotFoundMedicationLookup(name);
  }
}

/**
 * Looks up FDA warnings for a medication
 */
export async function lookupFDAWarnings(medication: MedicationLookupResult): Promise<MedicationLookupResult> {
  try {
    // Skip FDA lookup if we don't have a valid medication
    if (medication.status === 'inactive') {
      return medication;
    }
    
    const fdaResponse = await getFDAWarnings(medication.name);
    
    if (fdaResponse?.results?.length > 0) {
      // Extract warnings from FDA data
      const warnings: string[] = [];
      
      fdaResponse.results.forEach(result => {
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
        if (result.drug_interactions) {
          warnings.push(...result.drug_interactions);
        }
      });
      
      return {
        ...medication,
        source: 'FDA',
        warnings: warnings
      };
    }
    
    return medication;
  } catch (error) {
    console.error('Error looking up FDA warnings:', error);
    return medication;
  }
}

/**
 * Comprehensive medication lookup function that tries multiple sources
 */
export async function lookupMedication(name: string): Promise<MedicationLookupResult> {
  // First try RxNorm
  const rxResult = await lookupRxNormMedication(name);
  
  // If we found it in RxNorm, check for FDA warnings
  if (rxResult.status === 'active') {
    return lookupFDAWarnings(rxResult);
  }
  
  // If not found in RxNorm, return the not found result
  return rxResult;
}

/**
 * Checks if a medication lookup was successful
 */
export function isMedicationFound(lookup: MedicationLookupResult): boolean {
  return lookup.status === 'active' && !!lookup.id;
}
