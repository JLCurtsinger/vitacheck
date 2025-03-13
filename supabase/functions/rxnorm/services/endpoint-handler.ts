
import { buildRxNormUrl, RxNormEndpoint } from "../utils/url-builder.ts";
import { fetchRxCUIByName } from "./medication-lookup.ts";
import { corsHeaders } from "../utils/cors.ts";

/**
 * Handle operation requests to the RxNorm API
 * @param reqBody - The request body containing operation details
 * @returns Response with operation results
 */
export async function handleOperation(reqBody: any): Promise<Response> {
  const { operation, name, rxcui, rxcuis } = reqBody;
  
  // Support both rxcui and rxcuis for better compatibility
  let resolvedRxcui = rxcui || rxcuis;
  
  console.log(`🔍 RXNORM: Processing ${operation} request:`, { 
    name, 
    rxcui: resolvedRxcui,
    requestBody: reqBody
  });

  if (!operation) {
    return new Response(
      JSON.stringify({ 
        error: "Operation parameter is required",
        status: "error"
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let endpoint: RxNormEndpoint;
  
  switch (operation) {
    case "rxcui":
      if (!name) {
        return new Response(
          JSON.stringify({ 
            error: "Name parameter is required for rxcui operation",
            status: "error"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      endpoint = {
        path: "/rxcui.json",
        params: { name }
      };
      break;
    case "interactions":
      // If rxcui is missing but name is provided, try to fetch the rxcui first
      if (!resolvedRxcui && name) {
        console.log(`🔍 RXNORM: RxCUI missing for interactions. Attempting to fetch RxCUI for: ${name}`);
        
        resolvedRxcui = await fetchRxCUIByName(name);
        
        if (!resolvedRxcui) {
          return new Response(
            JSON.stringify({ 
              error: "Could not find RxCUI for the given medication name",
              status: "error",
              medication: name
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        console.log(`✅ RXNORM: Successfully resolved RxCUI for ${name}: ${resolvedRxcui}`);
      }
      
      if (!resolvedRxcui) {
        return new Response(
          JSON.stringify({ 
            error: "RxCUI parameter is required for interactions operation",
            status: "error" 
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      endpoint = {
        path: "/interaction/interaction.json",
        params: { rxcui: resolvedRxcui }
      };
      break;
    default:
      return new Response(
        JSON.stringify({ 
          error: "Invalid operation",
          status: "error"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
  }

  const rxnormUrl = buildRxNormUrl(endpoint);
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
      
      return new Response(
        JSON.stringify({ 
          error: `RxNorm API error (${response.status})`,
          details: errorText || response.statusText,
          status: "error"
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const data = await response.json();
    console.log(`✅ RXNORM: API response for ${operation}:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return new Response(
      JSON.stringify({
        ...data,
        status: "success"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`❌ RXNORM: Error fetching from RxNorm API:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        status: "error"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}
