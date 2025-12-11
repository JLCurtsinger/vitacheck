
import { corsHeaders } from '../utils/cors-utils';
import { createErrorResponse } from '../utils/error-utils';
import { makeRxNormApiRequest } from './api-service';

// Debug flag for logging
const isDebug = process.env.DEBUG === 'true';

/**
 * Merges and filters interaction results from multiple RxCUI queries
 * to find interactions that involve both medications
 */
export async function mergeInteractionResults(results: any[], rxcuiArray: string[]) {
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
    console.log(`[RxNorm Function] No valid results from any RxCUI request for: ${rxcuiArray.join(', ')} - returning 200 with empty interactions`);
    if (isDebug) {
      console.log('⚠️ RxNorm: No valid results from any RxCUI request');
    }
    // Return 200 with empty interactions instead of 404 - this is a valid "no data" case
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'No valid interaction data found',
        interactionTypeGroup: [],
        status: 'success'
      })
    };
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
  console.log(`[RxNorm Function] Returning interaction results: ${relevantInteractions.length} interactions found`);
  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...combinedResult,
      status: 'success'
    })
  };
}

/**
 * Fetches interaction data for multiple RxCUIs
 */
export async function fetchMultipleInteractions(resolvedRxcuis: string[]) {
  console.log(`[RxNorm Function] Processing interactions operation for ${resolvedRxcuis.length} RxCUIs: ${resolvedRxcuis.join(', ')}`);
  if (isDebug) {
    console.log(`🔍 RxNorm: Handling multiple RxCUIs (${resolvedRxcuis.length}): ${resolvedRxcuis.join(', ')}`);
  }
  
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
}

/**
 * Handles a single RxCUI interaction request
 */
export async function fetchSingleInteraction(rxcui: string) {
  const apiUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`;
  return await makeRxNormApiRequest(apiUrl);
}
