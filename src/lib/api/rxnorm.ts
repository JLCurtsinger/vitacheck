
/**
 * RxNorm API Integration Module
 * Handles interactions with the RxNorm API for medication lookups and interaction checking.
 */

interface RxNormResponse {
  idGroup?: {
    rxnormId?: string[];
  };
}

interface RxNormInteractionResponse {
  fullInteractionTypeGroup?: Array<{
    fullInteractionType: Array<{
      interactionPair: Array<{
        description: string;
        severity?: string;
      }>;
    }>;
  }>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds
const RXNORM_API_KEY = import.meta.env.VITE_RXNORM_API_KEY;

/**
 * Retrieves the RxCUI (RxNorm Concept Unique Identifier) for a given medication name.
 * @param medication - The name of the medication to look up
 * @returns The RxCUI if found, null otherwise
 */
export async function getRxCUI(medication: string): Promise<string | null> {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(medication.trim())}&apiKey=${RXNORM_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`RxNorm API error (${response.status}): ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RxNormResponse = await response.json();
      return data.idGroup?.rxnormId?.[0] || null;
      
    } catch (error) {
      attempts++;
      console.error(`RxNorm lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('All RxNorm lookup attempts failed for medication:', medication);
      return null;
    }
  }
  
  return null;
}

/**
 * Fetches drug interaction information for a given RxCUI.
 * @param rxCUI - The RxNorm Concept Unique Identifier
 * @returns Array of interaction data or empty array if none found
 */
export async function getDrugInteractions(rxCUI: string) {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxCUI}&apiKey=${RXNORM_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Drug interactions API error (${response.status}): ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: RxNormInteractionResponse = await response.json();
      return data.fullInteractionTypeGroup || [];
      
    } catch (error) {
      attempts++;
      console.error(`Drug interactions lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('All drug interactions lookup attempts failed for RxCUI:', rxCUI);
      return [];
    }
  }
  
  return [];
}
