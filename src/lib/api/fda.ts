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
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(medication.trim())}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('No FDA data found for medication:', medication);
          return { results: [] };
        }
        console.error(`FDA API error (${response.status}): ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FDAResponse = await response.json();
      return data;
      
    } catch (error) {
      attempts++;
      console.error(`FDA lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('All FDA lookup attempts failed for medication:', medication);
      return { results: [] };
    }
  }
  
  return { results: [] };
}