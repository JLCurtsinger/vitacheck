
import { corsHeaders } from "../utils/cors.ts";
import { createErrorResponse } from "../utils/error-utils.ts";
import { fetchRxCUIByName } from "./medication-lookup.ts";
import { fetchRxTermsSuggestions } from "./suggestion-service.ts";

/**
 * Handle operation requests to the RxNorm API
 * @param reqBody - The request body containing operation details
 * @returns Response with operation results
 */
export async function handleOperation(reqBody: any): Promise<Response> {
  const { operation, name, rxcui, rxcuis, term } = reqBody;
  
  // Support both rxcui and rxcuis for better compatibility
  let resolvedRxcui = rxcui || rxcuis;
  
  console.log(`🔍 RXNORM: Processing ${operation} request:`, { 
    name, 
    rxcui: resolvedRxcui,
    term,
    requestBody: reqBody
  });

  if (!operation) {
    return createErrorResponse(400, "Operation parameter is required");
  }

  switch (operation) {
    case "rxcui":
      if (!name) {
        return createErrorResponse(400, "Name parameter is required for rxcui operation");
      }
      
      return await handleRxCUIOperation(name);
      
    case "interactions":
      // If rxcui is missing but name is provided, try to fetch the rxcui first
      if (!resolvedRxcui && name) {
        console.log(`🔍 RXNORM: RxCUI missing for interactions. Attempting to fetch RxCUI for: ${name}`);
        
        resolvedRxcui = await fetchRxCUIByName(name);
        
        if (!resolvedRxcui) {
          return createErrorResponse(404, "Could not find RxCUI for the given medication name", name);
        }
        
        console.log(`✅ RXNORM: Successfully resolved RxCUI for ${name}: ${resolvedRxcui}`);
      }
      
      if (!resolvedRxcui) {
        return createErrorResponse(400, "RxCUI parameter is required for interactions operation");
      }
      
      return await handleInteractionsOperation(resolvedRxcui);
      
    case "suggest":
      if (!term) {
        return createErrorResponse(400, "Term parameter is required for suggest operation");
      }
      
      return await fetchRxTermsSuggestions(term);
      
    default:
      return createErrorResponse(400, "Invalid operation");
  }
}

/**
 * Handle RxCUI lookup operations
 * @param name - Medication name to look up
 */
async function handleRxCUIOperation(name: string): Promise<Response> {
  const rxnormUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`;
  console.log(`🔍 RXNORM: Fetching data from: ${rxnormUrl}`);
  
  try {
    const response = await fetch(rxnormUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RXNORM: API error (${response.status}):`, errorText);
      
      return createErrorResponse(response.status, `RxNorm API error (${response.status})`, errorText || response.statusText);
    }
    
    const data = await response.json();
    console.log(`✅ RXNORM: API response for rxcui:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return new Response(
      JSON.stringify({
        ...data,
        status: "success"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`❌ RXNORM: Error fetching from RxNorm API:`, error);
    return createErrorResponse(500, error.message, error.stack);
  }
}

/**
 * Handle drug interactions operations
 * @param rxcui - RxCUI to check interactions for
 */
async function handleInteractionsOperation(rxcui: string): Promise<Response> {
  const rxnormUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`;
  console.log(`🔍 RXNORM: Fetching data from: ${rxnormUrl}`);
  
  try {
    const response = await fetch(rxnormUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RXNORM: API error (${response.status}):`, errorText);
      
      return createErrorResponse(response.status, `RxNorm API error (${response.status})`, errorText || response.statusText);
    }
    
    const data = await response.json();
    console.log(`✅ RXNORM: API response for interactions:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return new Response(
      JSON.stringify({
        ...data,
        status: "success"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`❌ RXNORM: Error fetching from RxNorm API:`, error);
    return createErrorResponse(500, error.message, error.stack);
  }
}
