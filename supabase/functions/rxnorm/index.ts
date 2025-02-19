
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RxNormEndpoint {
  path: string;
  params: Record<string, string>;
}

function buildRxNormUrl(endpoint: RxNormEndpoint): string {
  const baseUrl = "https://rxnav.nlm.nih.gov/REST";
  const apiKey = Deno.env.get("RXNORM_API_KEY");
  const queryParams = new URLSearchParams({
    ...endpoint.params,
    apiKey: apiKey || "",
  });
  
  return `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const operation = url.searchParams.get("operation");
    const params: Record<string, string> = {};
    
    // Parse query parameters
    url.searchParams.forEach((value, key) => {
      if (key !== "operation") {
        params[key] = value;
      }
    });

    let endpoint: RxNormEndpoint;
    
    switch (operation) {
      case "rxcui":
        endpoint = {
          path: "/rxcui.json",
          params: { name: params.name || "" }
        };
        break;
      case "interactions":
        endpoint = {
          path: "/interaction/interaction.json",
          params: { rxcui: params.rxcui || "" }
        };
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const rxnormUrl = buildRxNormUrl(endpoint);
    console.log(`Fetching RxNorm data from: ${rxnormUrl}`);
    
    const response = await fetch(rxnormUrl);
    if (!response.ok) {
      throw new Error(`RxNorm API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in RxNorm proxy:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
