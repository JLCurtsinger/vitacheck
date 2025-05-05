
import { corsHeaders } from '../utils/cors-utils';
import { createErrorResponse } from '../utils/error-utils';
import { fetchRxCUIByName } from './rxcui-service';
import { fetchRxTermsSuggestions } from './suggestion-service';
import { makeRxNormApiRequest } from './api-service';

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
  const { name, rxcui, rxcuis, term } = params;
  
  // Support both rxcui and rxcuis for better compatibility
  // If rxcuis is an array, use it directly; if rxcui is provided as a string, put it in an array
  let resolvedRxcuis: string[] = [];
  
  if (Array.isArray(rxcuis)) {
    // Use the array directly
    resolvedRxcuis = rxcuis.filter(Boolean);
    if (isDebug) {
      console.log(`🔍 RxNorm: Using provided rxcuis array: ${resolvedRxcuis.join(', ')}`);
    }
  } else if (rxcuis && typeof rxcuis === 'string') {
    // If rxcuis is a string (maybe '+' delimited), split it
    resolvedRxcuis = rxcuis.split('+').filter(Boolean);
    if (isDebug) {
      console.log(`🔍 RxNorm: Converting string rxcuis to array: ${resolvedRxcuis.join(', ')}`);
    }
  } else if (rxcui) {
    // Fallback to single rxcui if provided
    resolvedRxcuis = [rxcui].filter(Boolean);
    if (isDebug) {
      console.log(`🔍 RxNorm: Using single rxcui: ${rxcui}`);
    }
  }
  
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
          return createErrorResponse(404, 'Could not find RxCUI for the given medication name', name);
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
        if (isDebug) {
          console.log(`🔍 RxNorm: Handling multiple RxCUIs (${resolvedRxcuis.length}): ${resolvedRxcuis.join(', ')}`);
        }
        
        // Make separate requests for each RxCUI
        try {
          const interactionResults = await Promise.all(
            resolvedRxcuis.map(async (id) => {
              const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${id}`;
              const result = await makeRxNormApiRequest(url);
              return {
                rxcui: id,
                response: result
              };
            })
          );
          
          if (isDebug) {
            console.log(`✅ RxNorm: Completed ${interactionResults.length} individual RxCUI requests`);
          }
          
          // Merge and filter results to find interactions involving both medications
          return await mergeInteractionResults(interactionResults, resolvedRxcuis);
        } catch (error) {
          console.error('❌ RxNorm: Error fetching multiple interactions:', error);
          return createErrorResponse(500, 'Error processing multiple RxCUI requests', error.message);
        }
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

/**
 * Merges and filters interaction results from multiple RxCUI queries
 * to find interactions that involve both medications
 */
async function mergeInteractionResults(results: any[], rxcuiArray: string[]) {
  if (isDebug) {
    console.log(`🔍 RxNorm: Merging interaction results for RxCUIs: ${rxcuiArray.join(', ')}`);
  }
  
  // Filter out failed requests
  const validResults = results.filter(r => 
    r.response && 
    r.response.statusCode === 200 && 
    r.response.body
  );
  
  if (validResults.length === 0) {
    if (isDebug) {
      console.log('⚠️ RxNorm: No valid results from any RxCUI request');
    }
    return createErrorResponse(404, 'No valid interaction data found');
  }
  
  // Parse the JSON responses
  const parsedResults = validResults.map(r => {
    try {
      return {
        rxcui: r.rxcui,
        data: JSON.parse(r.response.body)
      };
    } catch (e) {
      console.error(`❌ RxNorm: Error parsing response for RxCUI ${r.rxcui}:`, e);
      return null;
    }
  }).filter(Boolean);
  
  // Create a combined result structure with the same format as a single request
  let combinedResult = {
    nlmDisclaimer: parsedResults[0]?.data?.nlmDisclaimer || '',
    interactionTypeGroup: []
  };
  
  // Prepare to collect all interaction pairs involving both medications
  let relevantInteractions = [];
  
  // Extract unique interaction pairs from each result
  for (const result of parsedResults) {
    const groups = result.data?.interactionTypeGroup || [];
    
    for (const group of groups) {
      if (!group.interactionType) continue;
      
      for (const iType of group.interactionType) {
        if (!iType.interactionPair) continue;
        
        for (const pair of iType.interactionPair) {
          // Check if this pair involves another medication from our list
          const concept1 = pair.interactionConcept?.[0]?.minConceptItem?.rxcui;
          const concept2 = pair.interactionConcept?.[1]?.minConceptItem?.rxcui;
          
          // Only include interactions where both concepts are in our RxCUI list
          if (concept1 && concept2 && 
              rxcuiArray.includes(concept1) && 
              rxcuiArray.includes(concept2) &&
              concept1 !== concept2) {
            relevantInteractions.push(pair);
          }
        }
      }
    }
  }
  
  // If we found relevant interactions, format them into the expected structure
  if (relevantInteractions.length > 0) {
    combinedResult.interactionTypeGroup = [{
      sourceDisclaimer: "DrugBank",
      sourceName: "DrugBank",
      interactionType: [{
        interactionPair: relevantInteractions
      }]
    }];
    
    if (isDebug) {
      console.log(`✅ RxNorm: Found ${relevantInteractions.length} relevant interactions involving both medications`);
    }
  } else {
    if (isDebug) {
      console.log('ℹ️ RxNorm: No interactions found involving both medications');
    }
  }
  
  // Return a response with the same format as the original API
  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...combinedResult,
      status: 'success'
    })
  };
}
