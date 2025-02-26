
/**
 * RxNorm API Integration Module
 * Handles interactions with the RxNorm API for medication lookups and interaction checking.
 */

interface RxNormResponse {
  status: "success" | "error";
  data?: {
    idGroup?: {
      rxnormId?: string[];
    };
  };
  error?: string;
  details?: string;
  message?: string;
}

interface RxNormInteractionResponse {
  status: "success" | "error";
  data?: {
    fullInteractionTypeGroup?: Array<{
      fullInteractionType: Array<{
        interactionPair: Array<{
          description: string;
          severity?: string;
        }>;
      }>;
    }>;
  };
  error?: string;
  details?: string;
  message?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 500; // milliseconds

async function retryWithDelay(fn: () => Promise<any>, retries: number = MAX_RETRIES): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error instanceof Error && error.message.includes('404'))) {
      console.warn(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryWithDelay(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Retrieves the RxCUI (RxNorm Concept Unique Identifier) for a given medication name.
 * @param medication - The name of the medication to look up
 * @returns The RxCUI if found, null otherwise
 */
export async function getRxCUI(medication: string): Promise<string | null> {
  const makeRequest = async () => {
    console.log(`Attempting to get RxCUI for medication: ${medication}`);
    
    const response = await fetch('/.netlify/functions/rxnorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'rxcui',
        name: medication.trim()
      })
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      console.error('RxNorm API error:', {
        status: response.status,
        medication,
        error
      });
      throw error;
    }
    
    const data: RxNormResponse = await response.json();
    console.log('RxNorm API response:', data);
    
    if (data.status === 'error') {
      throw new Error(data.error || 'Unknown error occurred');
    }
    
    if (data.message === "No data found") {
      console.log('No RxCUI found for medication:', medication);
      return null;
    }
    
    return data.data?.idGroup?.rxnormId?.[0] || null;
  };

  try {
    return await retryWithDelay(makeRequest);
  } catch (error) {
    console.error(`All RxNorm lookup attempts failed for medication:`, {
      medication,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

/**
 * Fetches drug interaction information for given RxCUIs.
 * @param rxCUI - The RxNorm Concept Unique Identifiers (joined by "+")
 * @returns Array of interaction data or empty array if none found
 */
export async function getDrugInteractions(rxCUI: string) {
  const makeRequest = async () => {
    console.log(`Attempting to get drug interactions for RxCUI: ${rxCUI}`);
    
    const response = await fetch('/.netlify/functions/rxnorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'interactions',
        rxcui: rxCUI
      })
    });
    
    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      console.error('Drug interactions API error:', {
        status: response.status,
        rxcui: rxCUI,
        error
      });
      throw error;
    }
    
    const data: RxNormInteractionResponse = await response.json();
    console.log('Drug interactions API response:', data);
    
    if (data.status === 'error') {
      throw new Error(data.error || 'Unknown error occurred');
    }
    
    if (data.message === "No data found") {
      console.log('No interactions found for RxCUI:', rxCUI);
      return [];
    }
    
    return data.data?.fullInteractionTypeGroup || [];
  };

  try {
    return await retryWithDelay(makeRequest);
  } catch (error) {
    console.error(`All drug interactions lookup attempts failed for RxCUI:`, {
      rxcui: rxCUI,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return [];
  }
}
