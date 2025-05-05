
/**
 * RxNorm API Client
 * Handles core HTTP interactions with the RxNorm API
 */

import { delay } from '../utils/api-helpers';

// Session-level cache for RxNorm interactions
const interactionCache = new Map<string, any[]>();

// Constants
const INTERACTION_REQUEST_DELAY = 500; // milliseconds
const RETRY_DELAY = 500; // milliseconds

// Debug flag check
const isDebug = typeof window !== 'undefined' ? 
  localStorage.getItem('DEBUG') === 'true' : 
  process.env.DEBUG === 'true';

/**
 * Generates a cache key for interaction lookups
 */
function getInteractionCacheKey(rxCUIs: string[]): string {
  return [...rxCUIs].sort().join('+');
}

/**
 * Makes API request to RxNorm endpoint
 * @param operation - The operation to perform (rxcui, interactions)
 * @param params - Parameters for the operation
 */
export async function makeRxNormApiRequest(
  operation: string, 
  params: Record<string, string | string[]>
): Promise<any> {
  const requestBody = {
    operation,
    ...params
  };
  
  if (isDebug) {
    console.log(`📡 [RxNorm Client] Sending request to RxNorm:`, requestBody);
  }
  
  try {
    const response = await fetch('/.netlify/functions/rxnorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    // Handle potential 404 on cold start
    if (response.status === 404) {
      console.log("⚠️ [RxNorm Client] Netlify function 404 detected (cold start suspected), retrying once...");
      await delay(RETRY_DELAY);
      
      // Retry the request once
      const retryResponse = await fetch('/.netlify/functions/rxnorm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!retryResponse.ok) {
        if (isDebug) {
          console.error('❌ [RxNorm Client] API error after retry:', {
            status: retryResponse.status,
            params
          });
        }
        return null;
      }
      
      const retryData = await retryResponse.json();
      return retryData;
    }
    
    if (!response.ok) {
      if (isDebug) {
        console.error('❌ [RxNorm Client] API error:', {
          status: response.status,
          params
        });
      }
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ [RxNorm Client] Error in API request:`, error);
    return null;
  }
}

/**
 * Makes a request to get interaction data for given RxCUIs
 */
export async function fetchInteractionData(rxCUIs: string[]): Promise<any> {
  // Validate RxCUIs before proceeding
  const validRxCUIs = rxCUIs.filter(Boolean);
  if (validRxCUIs.length === 0) {
    if (isDebug) {
      console.warn('⚠️ [RxNorm Client] No valid RxCUIs provided for interaction check');
    }
    return [];
  }

  // Check cache for this set of RxCUIs
  const cacheKey = getInteractionCacheKey(validRxCUIs);
  if (interactionCache.has(cacheKey)) {
    if (isDebug) {
      console.log(`✅ [RxNorm Client] Using cached interactions for RxCUIs: ${cacheKey}`);
    }
    return interactionCache.get(cacheKey) || [];
  }
  
  // Add delay to prevent rate limiting
  await delay(INTERACTION_REQUEST_DELAY);
  
  if (isDebug) {
    console.log(`🔍 [RxNorm Client] Making interaction request with RxCUIs: ${validRxCUIs.join(', ')}`);
  }
  
  // Always pass rxcuis as an array
  const data = await makeRxNormApiRequest('interactions', { rxcuis: validRxCUIs });
  
  if (!data || data.status === 'error' || data.message === "No data found" || data.message === "No interactions found") {
    // No interactions is an expected result - don't log as warning
    if (isDebug) {
      console.log('ℹ️ [RxNorm Client] No interactions found for RxCUIs:', validRxCUIs.join(', '));
    }
    // Cache empty results
    interactionCache.set(cacheKey, []);
    return [];
  }
  
  // Adjust how we extract the interaction data from the response to accommodate changes in the Netlify function
  const interactionResults = data.interactionTypeGroup || 
                            data.data?.interactionTypeGroup || 
                            data.data?.fullInteractionTypeGroup || [];
  
  // Cache the successful result
  interactionCache.set(cacheKey, interactionResults);
  
  return interactionResults;
}
