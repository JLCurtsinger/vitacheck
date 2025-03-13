
import { buildRxNormUrl, RxNormEndpoint } from "../utils/url-builder.ts";

/**
 * Fetches RxCUI (RxNorm Concept Unique Identifier) for a medication name
 * @param name - Medication name to look up
 * @returns RxCUI string if found, null otherwise
 */
export async function fetchRxCUIByName(name: string): Promise<string | null> {
  console.log(`🔍 RXNORM: Fetching RxCUI for medication name: ${name}`);
  
  const endpoint: RxNormEndpoint = {
    path: "/rxcui.json",
    params: { name: name.trim() }
  };
  
  const rxnormUrl = buildRxNormUrl(endpoint);
  
  try {
    const response = await fetch(rxnormUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RXNORM: Error fetching RxCUI (${response.status})`);
      return null;
    }
    
    const data = await response.json();
    console.log(`⚙️ RXNORM: RxCUI lookup response:`, data);
    
    // Extract RxCUI from response
    const rxcui = data?.idGroup?.rxnormId?.[0] || null;
    
    if (rxcui) {
      console.log(`✅ RXNORM: Found RxCUI for ${name}: ${rxcui}`);
    } else {
      console.log(`⚠️ RXNORM: No RxCUI found for ${name}`);
    }
    
    return rxcui;
  } catch (error) {
    console.error(`❌ RXNORM: Failed to fetch RxCUI for ${name}:`, error);
    return null;
  }
}
