
import { getRxCUI } from '../rxnorm';
import { getSupplementInteractions } from '../suppai';
import { getFDAWarnings } from '../fda';
import { MedicationLookupResult } from '../types';
import { prepareMedicationNameForApi } from '@/utils/medication-formatter';

export async function lookupMedication(medication: string): Promise<MedicationLookupResult> {
  console.log(`🔍 [Medication Lookup] Starting lookup for: ${medication}`);
  
  // Create a result object to collect data from all sources
  const result: MedicationLookupResult = { 
    name: medication,
    source: 'Unknown', // Fix: Changed from empty string to 'Unknown'
    status: 'not_found'
  };
  
  // Format medication name for API calls
  const formattedMedication = prepareMedicationNameForApi(medication);
  
  // Start all three lookups in parallel
  console.log(`⚙️ [Medication Lookup] Starting parallel lookups for: ${formattedMedication}`);
  
  const [rxnormResult, suppaiResult, fdaResult] = await Promise.allSettled([
    (async () => {
      try {
        console.log(`⚙️ [Medication Lookup] Checking RxNorm for: ${formattedMedication}`);
        return await getRxCUI(formattedMedication);
      } catch (error) {
        console.error('❌ [Medication Lookup] RxNorm lookup failed:', error);
        return null;
      }
    })(),
    (async () => {
      try {
        console.log(`⚙️ [Medication Lookup] Checking SUPP.AI for: ${formattedMedication}`);
        return await getSupplementInteractions(formattedMedication);
      } catch (error) {
        console.error('❌ [Medication Lookup] SUPP.AI lookup failed:', error);
        return null;
      }
    })(),
    (async () => {
      try {
        console.log(`⚙️ [Medication Lookup] Checking FDA for: ${formattedMedication}`);
        return await getFDAWarnings(formattedMedication);
      } catch (error) {
        console.error('❌ [Medication Lookup] FDA lookup failed:', error);
        return null;
      }
    })()
  ]);
  
  // Process RxNorm result (source of truth for ID)
  if (rxnormResult.status === 'fulfilled' && rxnormResult.value) {
    const rxCUI = rxnormResult.value;
    result.status = 'found';
    result.source = 'RxNorm';
    result.id = rxCUI;
    console.log(`✅ [Medication Lookup] Found in RxNorm: ${medication} (${rxCUI})`);
    
    // Track if this was from a fallback mechanism
    if (rxCUI.startsWith('C') && !rxCUI.match(/^\d+$/)) {
      // CUI format (from SUPP.AI) rather than RxCUI format
      result.fallback = true;
      result.fallbackType = 'suppai';
      console.log(`⚠️ [Medication Lookup] Using fallback identifier from SUPP.AI: ${rxCUI}`);
    }
  } else {
    console.log(`⚠️ [Medication Lookup] Not found in RxNorm: ${medication}`);
  }

  // Process SUPP.AI result
  if (suppaiResult.status === 'fulfilled' && suppaiResult.value && suppaiResult.value.length > 0) {
    result.status = 'found';
    // Only override source if RxNorm didn't find anything
    if (!result.source || result.source === 'Unknown') {
      result.source = 'SUPP.AI';
      console.log(`✅ [Medication Lookup] Found in SUPP.AI: ${medication}`);
    }
  } else {
    console.log(`⚠️ [Medication Lookup] Not found in SUPP.AI: ${medication}`);
  }

  // Process FDA result
  if (fdaResult.status === 'fulfilled' && fdaResult.value && fdaResult.value.results && fdaResult.value.results.length > 0) {
    const fdaData = fdaResult.value;
    result.status = 'found';
    // Only override source if no previous source was set
    if (!result.source || result.source === 'Unknown') {
      result.source = 'FDA';
      console.log(`✅ [Medication Lookup] Found in FDA: ${medication}`);
    }
    // Add FDA warnings to the result
    result.warnings = fdaData.results[0].drug_interactions || [];
    
    // Check if we can get an RxCUI from the FDA response if we don't already have one
    if (!result.id && fdaData.results[0].openfda?.rxcui?.[0]) {
      result.id = fdaData.results[0].openfda.rxcui[0];
      result.fallback = true;
      result.fallbackType = 'fda';
      console.log(`✅ [Medication Lookup] Using RxCUI from FDA: ${result.id}`);
    }
  } else {
    console.log(`⚠️ [Medication Lookup] Not found in FDA: ${medication}`);
  }

  // Set found property for backward compatibility
  result.found = result.status === 'found';

  console.log(`✅ [Medication Lookup] Final result for ${medication}:`, result);
  return result;
}
