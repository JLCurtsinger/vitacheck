
/**
 * RxCUI Lookup Service
 * Handles lookups of RxCUI identifiers for medications
 */

import { makeRxNormApiRequest } from './rxnorm-client';
import { 
  getRxCUIFromLocalCache, 
  generateAlternativeFormats, 
  extractRxCUIFromFDALabel, 
  extractCUIFromSuppAI 
} from '../utils/rxnorm-fallback';
import { getFDAWarnings } from '../fda';
import { getSupplementInteractions } from '../suppai';

// Session-level cache for RxCUI lookups
const rxcuiCache = new Map<string, string | null>();

/**
 * Helper function to attempt RxCUI lookup with a specific format
 */
async function tryGetRxCUI(formattedMedication: string): Promise<string | null> {
  try {
    console.log(`🔍 [RxNorm Client] Trying format: "${formattedMedication}"`);
    
    const data = await makeRxNormApiRequest('rxcui', { name: formattedMedication.trim() });
    
    if (!data || data.status === 'error' || data.message === "No data found") {
      console.log(`⚠️ [RxNorm Client] No RxCUI found for format: ${formattedMedication}`);
      return null;
    }
    
    const rxcui = data.data?.idGroup?.rxnormId?.[0] || null;
    if (rxcui) {
      console.log(`✅ [RxNorm Client] RxCUI found with format "${formattedMedication}": ${rxcui}`);
    }
    return rxcui;
  } catch (error) {
    console.error(`❌ [RxNorm Client] Error trying format "${formattedMedication}":`, error);
    return null;
  }
}

/**
 * Retrieves the RxCUI (RxNorm Concept Unique Identifier) for a given medication name.
 * Enhanced with comprehensive fallback mechanisms.
 * @param medication - The name of the medication to look up
 * @returns The RxCUI if found, null otherwise
 */
export async function getRxCUI(medication: string): Promise<string | null> {
  console.log(`🔍 [RxNorm Client] Attempting to get RxCUI for medication: ${medication}`);
  
  // Check the cache first
  const medKey = medication.toLowerCase();
  if (rxcuiCache.has(medKey)) {
    console.log(`✅ [RxNorm Client] Using cached RxCUI for ${medication}: ${rxcuiCache.get(medKey)}`);
    return rxcuiCache.get(medKey);
  }
  
  // 1. Try with the original name first
  let rxcui = await tryGetRxCUI(medication);
  
  // 2. If not found, try local cache
  if (!rxcui) {
    rxcui = getRxCUIFromLocalCache(medication);
  }
  
  // 3. If still not found, try alternative formats
  if (!rxcui) {
    console.log(`[RxNorm Fallback] Trying alternative formats for "${medication}"`);
    const alternativeFormats = generateAlternativeFormats(medication);
    
    for (const format of alternativeFormats) {
      if (format === medication) continue; // Skip the original format, we already tried it
      
      console.log(`[RxNorm Fallback] Retrying RxNorm with alternative format: "${format}"`);
      rxcui = await tryGetRxCUI(format);
      
      if (rxcui) {
        console.log(`✅ [RxNorm Fallback] Found RxCUI using alternative format "${format}": ${rxcui}`);
        break;
      }
    }
  }
  
  // 4. If still not found, try getting RxCUI from FDA Label data
  if (!rxcui) {
    console.log(`[RxNorm Fallback] Attempting to get RxCUI from FDA Label data for "${medication}"`);
    try {
      const fdaData = await getFDAWarnings(medication);
      if (fdaData) {
        rxcui = extractRxCUIFromFDALabel(fdaData);
      }
    } catch (error) {
      console.error('[RxNorm Fallback] Error fetching FDA data:', error);
    }
  }
  
  // 5. Last resort: try SUPP.AI for supplements and herbal remedies
  if (!rxcui) {
    console.log(`[RxNorm Fallback] Attempting to get CUI from SUPP.AI for "${medication}"`);
    try {
      const suppaiData = await getSupplementInteractions(medication);
      if (suppaiData) {
        // SUPP.AI returns a CUI, not an RxCUI, but it's better than nothing
        // for supplements and herbs that might not be in RxNorm
        const cui = extractCUIFromSuppAI(suppaiData);
        if (cui) {
          // Use the CUI as a fallback identifier
          // Note that this is not an RxCUI, but a concept unique identifier
          rxcui = cui;
          console.log(`[RxNorm Fallback] Using CUI as fallback: ${cui}`);
        }
      }
    } catch (error) {
      console.error('[RxNorm Fallback] Error fetching SUPP.AI data:', error);
    }
  }
  
  if (rxcui) {
    console.log(`✅ [RxNorm Client] Finally found identifier for ${medication}: ${rxcui}`);
    // Cache the positive result
    rxcuiCache.set(medKey, rxcui);
  } else {
    console.log(`⚠️ [RxNorm Client] Could not find RxCUI for ${medication} after exhausting all fallback options`);
    // Cache the negative result to avoid repeating the same lookup
    rxcuiCache.set(medKey, null);
  }
  
  return rxcui;
}
