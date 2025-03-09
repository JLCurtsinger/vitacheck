
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RxNormEndpoint {
  path: string;
  params: Record<string, string>;
}

function buildRxNormUrl(endpoint: RxNormEndpoint): string {
  const baseUrl = "https://rxnav.nlm.nih.gov/REST";
  const apiKey = Deno.env.get("RXNORM_API_KEY");
  
  if (!apiKey) {
    throw new Error("RxNorm API key not found in environment variables");
  }
  
  const queryParams = new URLSearchParams({
    ...endpoint.params,
    apiKey
  });
  
  return `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
}

async function fetchRxCUIByName(name: string): Promise<string | null> {
  console.log(`🔍 RXNORM: Fetching RxCUI for medication name: ${name}`);
  
  const endpoint: RxNormEndpoint = {
    path: "/rxcui.json",
    params: { name: name.trim() }
  };
  
  const rxnormUrl = buildRxNormUrl(endpoint);
  
  try {
    const response = await fetch(rxnormUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RXNORM: Error fetching RxCUI (${response.status})`);
      return null;
    }
    
    const data = await response.json();
    console.log(`⚙️ RXNORM: RxCUI lookup response:`, data);
    
    // Extract RxCUI from response
    const rxcui = data?.idGroup?.rxnormId?.[0] || null;
    
    if (rxcui) {
      console.log(`✅ RXNORM: Found RxCUI for ${name}: ${rxcui}`);
    } else {
      console.log(`⚠️ RXNORM: No RxCUI found for ${name}`);
    }
    
    return rxcui;
  } catch (error) {
    console.error(`❌ RXNORM: Failed to fetch RxCUI for ${name}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqBody = await req.json();
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
    console.error("❌ RXNORM: Error in proxy:", error);
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
});
