import { getRxCUI } from '../rxnorm';
import { getSupplementInteractions } from '../suppai';
import { getFDAWarnings } from '../fda';
import { MedicationLookupResult } from '../types';

export async function lookupMedication(medication: string): Promise<MedicationLookupResult> {
  // Try RxNorm first
  try {
    const rxCUI = await getRxCUI(medication);
    if (rxCUI) {
      return { found: true, source: 'RxNorm', id: rxCUI };
    }
  } catch (error) {
    console.error('RxNorm lookup failed:', error);
  }

  // Try SUPP.AI next
  try {
    const suppAiResult = await getSupplementInteractions(medication);
    if (suppAiResult && suppAiResult.length > 0) {
      return { found: true, source: 'SUPP.AI' };
    }
  } catch (error) {
    console.error('SUPP.AI lookup failed:', error);
  }

  // Try FDA as last resort
  try {
    const fdaResult = await getFDAWarnings(medication);
    if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
      return {
        found: true,
        source: 'FDA',
        warnings: fdaResult.results[0].drug_interactions || []
      };
    }
  } catch (error) {
    console.error('FDA lookup failed:', error);
  }

  // If all lookups fail
  return { found: false };
}