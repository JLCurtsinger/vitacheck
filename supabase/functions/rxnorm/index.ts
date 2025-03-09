
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqBody = await req.json();
    const { operation, name, rxcui, rxcuis } = reqBody;
    
    // Support both rxcui and rxcuis for better compatibility
    const resolvedRxcui = rxcui || rxcuis;
    
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
