
import { corsHeaders } from '../utils/cors-utils';
import { createErrorResponse } from '../utils/error-utils';
import { fetchRxCUIByName } from './rxcui-service';
import { fetchRxTermsSuggestions } from './suggestion-service';

/**
 * Handles different operation types for RxNorm API
 */
export async function handleOperation(operation: string, params: any) {
  console.log(`🔍 RxNorm: Processing ${operation} operation:`, params);
  
  // Extract common parameters
  const { name, rxcui, rxcuis, term } = params;
  
  // Support both rxcui and rxcuis for better compatibility
  let resolvedRxcui = rxcui || rxcuis;
  
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
      // If rxcui is missing but name is provided, try to fetch the rxcui first
      if (!resolvedRxcui && name) {
        console.log(`🔍 RxNorm: RxCUI missing for interactions. Attempting to fetch RxCUI for: ${name}`);
        
        resolvedRxcui = await fetchRxCUIByName(name);
        
        if (!resolvedRxcui) {
          return createErrorResponse(404, 'Could not find RxCUI for the given medication name', name);
        }
        
        console.log(`✅ RxNorm: Successfully resolved RxCUI for ${name}: ${resolvedRxcui}`);
      }
      
      if (!resolvedRxcui) {
        return createErrorResponse(400, 'RxCUI parameter is required for interactions operation');
      }
      
      apiUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${resolvedRxcui}`;
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

/**
 * Makes a direct request to RxNorm API
 * @param apiUrl - Complete URL for the RxNorm API call
 */
async function makeRxNormApiRequest(apiUrl: string) {
  console.log(`🌐 RxNorm: Making API request to: ${apiUrl}`);
  
  try {
    // Make request to RxNorm API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RxNorm: API error (${response.status}):`, errorText);
      
      return {
        statusCode: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `RxNorm API error (${response.status})`,
          details: errorText || response.statusText,
          status: 'error'
        })
      };
    }
    
    const data = await response.json();
    console.log(`✅ RxNorm: API response:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        status: 'success'
      })
    };
  } catch (error) {
    console.error('❌ RxNorm: Error in API request:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack,
        status: 'error'
      })
    };
  }
}
