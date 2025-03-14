
import { getRxCUI } from '../rxnorm';
import { getSupplementInteractions } from '../suppai';
import { getFDAWarnings } from '../fda';
import { MedicationLookupResult } from '../types';

export async function lookupMedication(medication: string): Promise<MedicationLookupResult> {
  console.log(`🔍 [Medication Lookup] Starting lookup for: ${medication}`);
  
  // Create a result object to collect data from all sources
  const result: MedicationLookupResult = { 
    name: medication,
    source: '',
    status: 'not_found'
  };
  
  // Check RxNorm
  try {
    console.log(`⚙️ [Medication Lookup] Checking RxNorm for: ${medication}`);
    const rxCUI = await getRxCUI(medication);
    if (rxCUI) {
      result.status = 'found';
      result.source = 'RxNorm';
      result.id = rxCUI;
      console.log(`✅ [Medication Lookup] Found in RxNorm: ${medication} (${rxCUI})`);
    } else {
      console.log(`⚠️ [Medication Lookup] Not found in RxNorm: ${medication}`);
    }
  } catch (error) {
    console.error('❌ [Medication Lookup] RxNorm lookup failed:', error);
  }

  // Check SUPP.AI - run regardless of RxNorm result
  try {
    console.log(`⚙️ [Medication Lookup] Checking SUPP.AI for: ${medication}`);
    const suppAiResult = await getSupplementInteractions(medication);
    if (suppAiResult && suppAiResult.length > 0) {
      result.status = 'found';
      // Only override source if RxNorm didn't find anything
      if (!result.source) {
        result.source = 'SUPP.AI';
        console.log(`✅ [Medication Lookup] Found in SUPP.AI: ${medication}`);
      }
    } else {
      console.log(`⚠️ [Medication Lookup] Not found in SUPP.AI: ${medication}`);
    }
  } catch (error) {
    console.error('❌ [Medication Lookup] SUPP.AI lookup failed:', error);
  }

  // Check FDA - run regardless of previous results
  try {
    console.log(`⚙️ [Medication Lookup] Checking FDA for: ${medication}`);
    const fdaResult = await getFDAWarnings(medication);
    if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
      result.status = 'found';
      // Only override source if no previous source was set
      if (!result.source) {
        result.source = 'FDA';
        console.log(`✅ [Medication Lookup] Found in FDA: ${medication}`);
      }
      // Add FDA warnings to the result
      result.warnings = fdaResult.results[0].drug_interactions || [];
    } else {
      console.log(`⚠️ [Medication Lookup] Not found in FDA: ${medication}`);
    }
  } catch (error) {
    console.error('❌ [Medication Lookup] FDA lookup failed:', error);
  }

  // Set found property for backward compatibility
  result.found = result.status === 'found';

  console.log(`✅ [Medication Lookup] Final result for ${medication}:`, result);
  return result;
}
