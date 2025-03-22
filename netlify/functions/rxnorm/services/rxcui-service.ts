
import { formatMedicationName } from '../utils/medication-utils';

/**
 * Fetches RxCUI (RxNorm Concept Unique Identifier) for a medication name
 * @param name - Medication name to look up
 */
export async function fetchRxCUIByName(name: string): Promise<string | null> {
  console.log(`🔍 RxNorm: Fetching RxCUI for medication name: ${name}`);
  
  // Format the name for better API matching
  const formattedName = formatMedicationName(name);
  console.log(`🔍 RxNorm: Using formatted name: ${formattedName}`);
  
  // Build URL for RxNorm API call
  const rxcuiLookupUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(formattedName)}`;
  console.log(`🌐 RxNorm: Making API request to: ${rxcuiLookupUrl}`);
  
  try {
    const response = await fetch(rxcuiLookupUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RxNorm: Error fetching RxCUI (${response.status})`);
      return null;
    }
    
    const data = await response.json();
    console.log(`⚙️ RxNorm: RxCUI lookup response:`, data);
    
    // Extract RxCUI from response
    const rxcui = data?.idGroup?.rxnormId?.[0] || null;
    
    if (rxcui) {
      console.log(`✅ RxNorm: Found RxCUI for ${formattedName}: ${rxcui}`);
    } else {
      console.log(`⚠️ RxNorm: No RxCUI found for ${formattedName}`);
    }
    
    return rxcui;
  } catch (error) {
    console.error(`❌ RxNorm: Failed to fetch RxCUI for ${formattedName}:`, error);
    return null;
  }
}
