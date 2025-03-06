
import { getRxCUI } from '../rxnorm';
import { getSupplementInteractions } from '../suppai';
import { getFDAWarnings } from '../fda';
import { MedicationLookupResult } from '../types';

export async function lookupMedication(medication: string): Promise<MedicationLookupResult> {
  // Create a result object to collect data from all sources
  const result: MedicationLookupResult = { found: false };
  
  // Check RxNorm
  try {
    const rxCUI = await getRxCUI(medication);
    if (rxCUI) {
      result.found = true;
      result.source = 'RxNorm';
      result.id = rxCUI;
    }
  } catch (error) {
    console.error('RxNorm lookup failed:', error);
  }

  // Check SUPP.AI - run regardless of RxNorm result
  try {
    const suppAiResult = await getSupplementInteractions(medication);
    if (suppAiResult && suppAiResult.length > 0) {
      result.found = true;
      // Only override source if RxNorm didn't find anything
      if (!result.source) {
        result.source = 'SUPP.AI';
      }
    }
  } catch (error) {
    console.error('SUPP.AI lookup failed:', error);
  }

  // Check FDA - run regardless of previous results
  try {
    const fdaResult = await getFDAWarnings(medication);
    if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
      result.found = true;
      // Only override source if no previous source was set
      if (!result.source) {
        result.source = 'FDA';
      }
      // Add FDA warnings to the result
      result.warnings = fdaResult.results[0].drug_interactions || [];
    }
  } catch (error) {
    console.error('FDA lookup failed:', error);
  }

  return result;
}
