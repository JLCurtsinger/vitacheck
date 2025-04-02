
/**
 * FDA API Integration Module
 * Handles interactions with the openFDA API for medication warnings and adverse effects.
 */
import { prepareMedicationNameForApi } from '@/utils/medication-formatter';

export interface FDAResponse {
  results?: Array<{
    warnings?: string[];
    drug_interactions?: string[];
    openfda?: {
      rxcui?: string[];
      [key: string]: any;
    };
  }>;
}

// Session-level cache for FDA warnings
const fdaWarningsCache = new Map<string, FDAResponse>();

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

/**
 * Fetches medication warnings from the FDA API.
 * @param medication - The name of the medication to check
 * @returns FDA warning data or empty response if none found
 */
export async function getFDAWarnings(medication: string): Promise<FDAResponse> {
  let attempts = 0;
  
  // Format medication name properly for FDA API
  const formattedMedication = prepareMedicationNameForApi(medication);
  
  console.log(`🔍 [FDA Client] Fetching warnings for: ${medication}`);
  console.log(`🔍 [FDA Client] Using formatted name: ${formattedMedication}`);
  
  // Check if this medication's warnings are already in the cache
  if (fdaWarningsCache.has(formattedMedication)) {
    console.log(`✅ [FDA Client] Using cached warnings for: ${formattedMedication}`);
    return fdaWarningsCache.get(formattedMedication)!;
  }
  
  while (attempts < MAX_RETRIES) {
    try {
      // Expand search to include both brand and generic names using OR
      const encodedMedication = encodeURIComponent(formattedMedication.trim());
      const searchQuery = `openfda.brand_name:"${encodedMedication}"+OR+openfda.generic_name:"${encodedMedication}"`;
      const url = `https://api.fda.gov/drug/label.json?search=${searchQuery}`;
      
      console.log(`🔍 [FDA Client] Making API request: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('⚠️ [FDA Client] No FDA data found for medication:', formattedMedication);
          const emptyResponse = { results: [] };
          fdaWarningsCache.set(formattedMedication, emptyResponse);
          return emptyResponse;
        }
        console.error(`❌ [FDA Client] API error (${response.status}): ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FDAResponse = await response.json();
      console.log(`✅ [FDA Client] Received data for ${formattedMedication}:`, 
        data.results ? `Found ${data.results.length} results` : 'No results');
      
      // Cache successful responses
      fdaWarningsCache.set(formattedMedication, data);
      
      return data;
      
    } catch (error) {
      attempts++;
      console.error(`❌ [FDA Client] Lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('❌ [FDA Client] All lookup attempts failed for medication:', formattedMedication);
      // Cache empty response for failed attempts to prevent repeated failures
      const emptyResponse = { results: [] };
      fdaWarningsCache.set(formattedMedication, emptyResponse);
      return emptyResponse;
    }
  }
  
  return { results: [] };
}
