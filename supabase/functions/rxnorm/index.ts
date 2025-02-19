
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
    console.error("RxNorm API Key is missing in Edge Function environment variables");
    throw new Error("RxNorm API key not configured");
  }
  
  console.log("Successfully retrieved RxNorm API key");
  
  const queryParams = new URLSearchParams({
    ...endpoint.params
  });
  
  const url = `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
  console.log(`Constructed RxNorm API URL (sanitized): ${url.replace(apiKey, '[REDACTED]')}`);
  
  return url;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify API key exists before processing request
    const apiKey = Deno.env.get("RXNORM_API_KEY");
    if (!apiKey) {
      console.error("RxNorm API Key is missing in Edge Function environment variables");
      return new Response(
        JSON.stringify({ 
          error: "RxNorm API key not configured",
          details: "Please configure the RXNORM_API_KEY in Supabase Edge Function settings"
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const { operation, name, rxcui } = await req.json();
    console.log(`Processing ${operation} request with params:`, { name, rxcui });

    if (!operation) {
      return new Response(
        JSON.stringify({ error: "Operation parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint: RxNormEndpoint;
    
    switch (operation) {
      case "rxcui":
        if (!name) {
          return new Response(
            JSON.stringify({ error: "Name parameter is required for rxcui operation" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = {
          path: "/rxcui.json",
          params: { name }
        };
        break;
      case "interactions":
        if (!rxcui) {
          return new Response(
            JSON.stringify({ error: "RxCUI parameter is required for interactions operation" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        endpoint = {
          path: "/interaction/interaction.json",
          params: { rxcui }
        };
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
      const rxnormUrl = buildRxNormUrl(endpoint);
      console.log(`Making request to RxNorm API...`);
      
      const response = await fetch(rxnormUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`RxNorm API error (${response.status}):`, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: `RxNorm API error (${response.status})`,
            details: errorText || response.statusText
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      const data = await response.json();
      console.log(`Successfully received RxNorm API response for ${operation}`);
      
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error(`Error making RxNorm API request:`, error);
      throw new Error(`Failed to fetch from RxNorm API: ${error.message}`);
    }

  } catch (error) {
    console.error("Error in RxNorm Edge Function:", error);
    return new Response(
      JSON.stringify({ 
        error: "RxNorm Edge Function error",
        details: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
