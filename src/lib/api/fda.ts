
/**
 * FDA API Integration Module
 * Handles interactions with the openFDA API for medication warnings and adverse effects.
 */

export interface FDAResponse {
  results?: Array<{
    warnings?: string[];
    drug_interactions?: string[];
  }>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

/**
 * Fetches medication warnings from the FDA API.
 * @param medication - The name of the medication to check
 * @returns FDA warning data or empty response if none found
 */
export async function getFDAWarnings(medication: string): Promise<FDAResponse> {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      // Expand search to include both brand and generic names using OR
      const encodedMedication = encodeURIComponent(medication.trim());
      const searchQuery = `openfda.brand_name:"${encodedMedication}"+OR+openfda.generic_name:"${encodedMedication}"`;
      const url = `https://api.fda.gov/drug/label.json?search=${searchQuery}`;
      
      console.log(`[OpenFDA] Making API request: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('[OpenFDA] No FDA data found for medication:', medication);
          return { results: [] };
        }
        console.error(`[OpenFDA] API error (${response.status}): ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FDAResponse = await response.json();
      console.log(`[OpenFDA] Received data for ${medication}:`, 
        data.results ? `Found ${data.results.length} results` : 'No results');
      return data;
      
    } catch (error) {
      attempts++;
      console.error(`[OpenFDA] Lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('[OpenFDA] All lookup attempts failed for medication:', medication);
      return { results: [] };
    }
  }
  
  return { results: [] };
}
