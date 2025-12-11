
import { corsHeaders } from '../utils/cors-utils';
import { createErrorResponse } from '../utils/error-utils';
import { fetchRxCUIByName } from './rxcui-service';
import { fetchRxTermsSuggestions } from './suggestion-service';
import { makeRxNormApiRequest } from './api-service';
import { fetchMultipleInteractions, fetchSingleInteraction } from './interaction-service';
import { processRxCuiParameters } from './parameter-processor';

// Debug flag for logging
const isDebug = process.env.DEBUG === 'true';

/**
 * Handles different operation types for RxNorm API
 */
export async function handleOperation(operation: string, params: any) {
  if (isDebug) {
    console.log(`🔍 RxNorm: Processing ${operation} operation:`, params);
  }
  
  // Extract common parameters
  const { name, term } = params;
  
  // Process RxCUI parameters to handle different input formats
  let resolvedRxcuis = processRxCuiParameters(params);
  
  // Validate the operation
  if (!operation) {
    return createErrorResponse(400, 'Operation parameter is required');
  }
  
  let apiUrl = '';
  let result = null;
  
  // Handle different operation types
  switch (operation) {
    case 'rxcui':
      if (!name) {
        return createErrorResponse(400, 'Name parameter is required for rxcui operation');
      }
      
      apiUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`;
      break;
      
    case 'interactions':
      // If rxcuis are missing but name is provided, try to fetch the rxcui first
      if (resolvedRxcuis.length === 0 && name) {
        if (isDebug) {
          console.log(`🔍 RxNorm: RxCUIs missing for interactions. Attempting to fetch RxCUI for: ${name}`);
        }
        
        const fetchedRxcui = await fetchRxCUIByName(name);
        
        if (!fetchedRxcui) {
          // Return 200 with error payload instead of 404 - this is a recoverable lookup failure
          return {
            statusCode: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: false,
              error: 'Could not find RxCUI for the given medication name',
              details: name,
              interactionTypeGroup: [],
              status: 'success'
            })
          };
        }
        
        resolvedRxcuis = [fetchedRxcui];
        if (isDebug) {
          console.log(`✅ RxNorm: Successfully resolved RxCUI for ${name}: ${fetchedRxcui}`);
        }
      }
      
      if (resolvedRxcuis.length === 0) {
        return createErrorResponse(400, 'RxCUIs parameter is required for interactions operation');
      }
      
      // If we have multiple RxCUIs (2 or 3 is the expected range for combinations)
      if (resolvedRxcuis.length >= 2 && resolvedRxcuis.length <= 3) {
        return await fetchMultipleInteractions(resolvedRxcuis);
      } else {
        // Single RxCUI case - use the original logic
        apiUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${resolvedRxcuis[0]}`;
      }
      break;
      
    case 'suggest':
      if (!term) {
        return createErrorResponse(400, 'Term parameter is required for suggest operation');
      }
      
      // Use the dedicated function for suggestions
      result = await fetchRxTermsSuggestions(term);
      
      if (!result) {
        return createErrorResponse(404, 'Failed to fetch suggestions', term);
      }
      
      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...result,
          status: 'success'
        })
      };
      
    default:
      return createErrorResponse(400, 'Invalid operation');
  }
  
  // For operations that need a direct API call (not suggest)
  if (apiUrl) {
    return await makeRxNormApiRequest(apiUrl);
  }
  
  // Fallback error response
  return createErrorResponse(500, 'Unexpected error in operation handling');
}
