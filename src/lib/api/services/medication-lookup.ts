import { getRxCUI } from '../rxnorm';
import { getSupplementInteractions } from '../suppai';
import { getFDAWarnings } from '../fda';
import { MedicationLookupResult } from '../types';
import { prepareMedicationNameForApi } from '@/utils/medication-formatter';
import { getUsageStats } from '@/services/usage';

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
  
  // Check RxNorm with enhanced fallback system
  try {
    console.log(`⚙️ [Medication Lookup] Checking RxNorm for: ${formattedMedication}`);
    const rxCUI = await getRxCUI(formattedMedication);
    if (rxCUI) {
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
  } catch (error) {
    console.error('❌ [Medication Lookup] RxNorm lookup failed:', error);
  }

  // Check SUPP.AI - run regardless of RxNorm result
  try {
    console.log(`⚙️ [Medication Lookup] Checking SUPP.AI for: ${formattedMedication}`);
    const suppAiResult = await getSupplementInteractions(formattedMedication);
    if (suppAiResult && suppAiResult.length > 0) {
      result.status = 'found';
      // Only override source if RxNorm didn't find anything
      if (!result.source || result.source === 'Unknown') {
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
    console.log(`⚙️ [Medication Lookup] Checking FDA for: ${formattedMedication}`);
    const fdaResult = await getFDAWarnings(formattedMedication);
    if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
      result.status = 'found';
      // Only override source if no previous source was set
      if (!result.source || result.source === 'Unknown') {
        result.source = 'FDA';
        console.log(`✅ [Medication Lookup] Found in FDA: ${medication}`);
      }
      // Add FDA warnings to the result
      result.warnings = fdaResult.results[0].drug_interactions || [];
      
      // Check if we can get an RxCUI from the FDA response if we don't already have one
      if (!result.id && fdaResult.results[0].openfda?.rxcui?.[0]) {
        result.id = fdaResult.results[0].openfda.rxcui[0];
        result.fallback = true;
        result.fallbackType = 'fda';
        console.log(`✅ [Medication Lookup] Using RxCUI from FDA: ${result.id}`);
      }
    } else {
      console.log(`⚠️ [Medication Lookup] Not found in FDA: ${medication}`);
    }
  } catch (error) {
    console.error('❌ [Medication Lookup] FDA lookup failed:', error);
  }

  // Check CMS Usage Data - run regardless of previous results
  try {
    console.log(`⚙️ [Medication Lookup] Checking CMS Usage Data for: ${formattedMedication}`);
    const usageData = await getUsageStats(formattedMedication);
    if (usageData) {
      console.log(`✅ [Medication Lookup] Found CMS Usage Data for ${medication}:`, usageData);
      result.usageData = usageData;
    } else {
      console.log(`⚠️ [Medication Lookup] No CMS Usage Data found for: ${medication}`);
    }
  } catch (error) {
    console.error('❌ [Medication Lookup] CMS Usage Data lookup failed:', error);
  }

  // Set found property for backward compatibility
  result.found = result.status === 'found';

  console.log(`✅ [Medication Lookup] Final result for ${medication}:`, result);
  return result;
}
