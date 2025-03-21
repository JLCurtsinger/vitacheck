
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
  console.log(`🔍 [RxNorm Client] Attempting to get RxCUI for medication: ${medication}`);
  
  // Try with original input
  let rxcui = await tryGetRxCUI(medication);
  
  // If not found, try some alternate formats
  if (!rxcui) {
    // Try lowercase
    rxcui = await tryGetRxCUI(medication.toLowerCase());
    
    if (!rxcui) {
      // Try uppercase first letter
      const capitalized = medication.charAt(0).toUpperCase() + medication.slice(1).toLowerCase();
      rxcui = await tryGetRxCUI(capitalized);
      
      if (!rxcui) {
        // Try all uppercase
        rxcui = await tryGetRxCUI(medication.toUpperCase());
      }
    }
  }
  
  if (rxcui) {
    console.log(`✅ [RxNorm Client] Finally found RxCUI for ${medication}: ${rxcui}`);
  } else {
    console.log(`⚠️ [RxNorm Client] Could not find RxCUI for ${medication} after trying multiple formats`);
  }
  
  return rxcui;
}

/**
 * Helper function to attempt RxCUI lookup with a specific format
 */
async function tryGetRxCUI(formattedMedication: string): Promise<string | null> {
  try {
    console.log(`🔍 [RxNorm Client] Trying format: "${formattedMedication}"`);
    
    const response = await fetch('/.netlify/functions/rxnorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'rxcui',
        name: formattedMedication.trim()
      })
    });
    
    if (!response.ok) {
      console.error('❌ [RxNorm Client] API error:', {
        status: response.status,
        medication: formattedMedication
      });
      return null;
    }
    
    const data: RxNormResponse = await response.json();
    
    if (data.status === 'error' || data.message === "No data found") {
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
 * Fetches drug interaction information for given RxCUIs.
 * @param rxCUIs - Array of RxNorm Concept Unique Identifiers
 * @returns Array of interaction data or empty array if none found
 */
export async function getDrugInteractions(rxCUIs: string[]): Promise<any[]> {
  // Validate RxCUIs before proceeding
  const validRxCUIs = rxCUIs.filter(Boolean);
  if (validRxCUIs.length === 0) {
    console.warn('⚠️ [RxNorm Client] No valid RxCUIs provided for interaction check');
    return [];
  }

  console.log('🔍 [RxNorm Client] Checking interactions for RxCUIs:', validRxCUIs);
  
  // Add delay to prevent rate limiting
  await delay(INTERACTION_REQUEST_DELAY);
  
  const rxcuiString = validRxCUIs.join('+');
  console.log(`🔍 [RxNorm Client] Making interaction request with RxCUIs: ${rxcuiString}`);
  
  // FIXED: Using the correct parameter name 'rxcui' instead of 'rxcuis'
  const requestBody = {
    operation: 'interactions',
    rxcui: rxcuiString
  };
  
  console.log(`📡 [RxNorm Client] Sending request to RxNorm:`, requestBody);
  
  const response = await fetch('/.netlify/functions/rxnorm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    console.error('❌ [RxNorm Client] Drug interactions API error:', {
      status: response.status,
      rxcuis: rxcuiString,
      requestBody
    });
    return [];
  }
  
  const data: RxNormInteractionResponse = await response.json();
  console.log('⚙️ [RxNorm Client] Drug interactions API raw response:', data);
  
  if (data.status === 'error' || data.message === "No data found" || data.message === "No interactions found") {
    console.log('⚠️ [RxNorm Client] No interactions found for RxCUIs:', rxcuiString);
    return [];
  }
  
  const interactionResults = data.data?.fullInteractionTypeGroup || [];
  console.log('✅ [RxNorm Client] Processed interaction results:', 
    interactionResults.length > 0 ? `Found ${interactionResults.length} interaction groups` : 'No interactions');
  
  return interactionResults;
}
