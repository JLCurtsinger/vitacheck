
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400' // 24 hours cache for preflight requests
};

// Timeout duration for RxNorm API calls (in milliseconds)
const API_TIMEOUT = 10000; // 10 seconds

interface RxNormEndpoint {
  path: string;
  params: Record<string, string>;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

function buildRxNormUrl(endpoint: RxNormEndpoint): string {
  const baseUrl = "https://rxnav.nlm.nih.gov/REST";
  const apiKey = Deno.env.get("RXNORM_API_KEY");
  
  if (!apiKey) {
    console.error("RxNorm API Key is missing");
    throw new Error("RxNorm API key not configured");
  }
  
  const queryParams = new URLSearchParams(endpoint.params);
  const url = `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
  console.log(`Making request to RxNorm API (sanitized URL): ${url}`);
  
  return url;
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const apiKey = Deno.env.get("RXNORM_API_KEY");
    if (!apiKey) {
      console.error("RxNorm API Key is missing");
      return new Response(
        JSON.stringify({ 
          error: "Configuration error",
          details: "API key not configured"
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    const { operation, name, rxcui } = await req.json();
    console.log(`Processing ${operation} request`);

    if (!operation) {
      return new Response(
        JSON.stringify({ error: "Operation parameter is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let endpoint: RxNormEndpoint;
    
    switch (operation) {
      case "rxcui":
        if (!name) {
          return new Response(
            JSON.stringify({ error: "Name parameter is required for rxcui operation" }),
            { status: 400, headers: corsHeaders }
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
            { status: 400, headers: corsHeaders }
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
          { status: 400, headers: corsHeaders }
        );
    }

    try {
      const rxnormUrl = buildRxNormUrl(endpoint);
      
      const response = await fetchWithTimeout(
        rxnormUrl,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`RxNorm API error (${response.status}):`, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: `RxNorm API error (${response.status})`,
            details: errorText
          }),
          { 
            status: response.status,
            headers: corsHeaders
          }
        );
      }
      
      const data = await response.json();
      console.log(`Successfully received RxNorm API response for ${operation}`);
      
      return new Response(
        JSON.stringify(data),
        { 
          status: 200,
          headers: corsHeaders
        }
      );

    } catch (error) {
      console.error(`Error making RxNorm API request:`, error);
      
      if (error.message.includes('timed out')) {
        return new Response(
          JSON.stringify({ 
            error: "Request timeout",
            details: "The RxNorm API request timed out"
          }),
          { 
            status: 504,
            headers: corsHeaders
          }
        );
      }
      
      throw error;
    }

  } catch (error) {
    console.error("Error in RxNorm Edge Function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
