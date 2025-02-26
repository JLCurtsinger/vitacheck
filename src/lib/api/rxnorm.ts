
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

const INTERACTION_REQUEST_DELAY = 500; // milliseconds

/**
 * Delay function to prevent rate limiting
 * @param ms - milliseconds to delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retrieves the RxCUI (RxNorm Concept Unique Identifier) for a given medication name.
 * @param medication - The name of the medication to look up
 * @returns The RxCUI if found, null otherwise
 */
export async function getRxCUI(medication: string): Promise<string | null> {
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
    console.error('RxNorm API error:', {
      status: response.status,
      medication
    });
    return null;
  }
  
  const data: RxNormResponse = await response.json();
  console.log('RxNorm API response:', data);
  
  if (data.status === 'error' || data.message === "No data found") {
    console.log('No RxCUI found for medication:', medication);
    return null;
  }
  
  const rxcui = data.data?.idGroup?.rxnormId?.[0] || null;
  console.log(`Retrieved RxCUI for ${medication}:`, rxcui);
  return rxcui;
}

/**
 * Fetches drug interaction information for given RxCUIs.
 * @param rxCUIs - Array of RxNorm Concept Unique Identifiers
 * @returns Array of interaction data or empty array if none found
 */
export async function getDrugInteractions(rxCUIs: string[]): Promise<any[]> {
  // Validate RxCUIs before proceeding
  const validRxCUIs = rxCUIs.filter(Boolean);
  if (validRxCUIs.length === 0) {
    console.warn('No valid RxCUIs provided for interaction check');
    return [];
  }

  console.log('Checking interactions for RxCUIs:', validRxCUIs);
  
  // Add delay to prevent rate limiting
  await delay(INTERACTION_REQUEST_DELAY);
  
  const rxcuiString = validRxCUIs.join('+');
  console.log(`Making interaction request with RxCUIs: ${rxcuiString}`);
  
  const response = await fetch('/.netlify/functions/rxnorm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation: 'interactions',
      rxcui: rxcuiString
    })
  });
  
  if (!response.ok) {
    console.error('Drug interactions API error:', {
      status: response.status,
      rxcuis: rxcuiString
    });
    return [];
  }
  
  const data: RxNormInteractionResponse = await response.json();
  console.log('Drug interactions API response:', data);
  
  if (data.status === 'error' || data.message === "No data found") {
    console.log('No interactions found for RxCUIs:', rxcuiString);
    return [];
  }
  
  return data.data?.fullInteractionTypeGroup || [];
}

/**
 * Processes a list of medications to check for interactions
 * @param medications - Array of medication names to check
 * @returns Array of interaction data
 */
export async function processInteractions(medications: string[]): Promise<any[]> {
  // First, get RxCUIs for all medications
  const rxcuiPromises = medications.map(med => getRxCUI(med));
  const rxcuis = await Promise.all(rxcuiPromises);
  
  // Filter out any medications where RxCUI lookup failed
  const validRxCUIs = rxcuis.filter(Boolean) as string[];
  
  if (validRxCUIs.length < 2) {
    console.warn('Not enough valid RxCUIs found for interaction check', {
      total: medications.length,
      valid: validRxCUIs.length,
      medications,
      rxcuis: validRxCUIs
    });
    return [];
  }
  
  // Proceed with interaction check
  return getDrugInteractions(validRxCUIs);
}
