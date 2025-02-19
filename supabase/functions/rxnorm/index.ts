
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Max-Age': '86400'
};

const API_TIMEOUT = 10000; // 10 seconds timeout

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
    console.error('Fetch with timeout error:', error);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

export default async function handler(req: Request) {
  // Immediate response for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    const apiKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey) {
      console.error('Invalid or missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    const rxnormApiKey = Deno.env.get("RXNORM_API_KEY");
    if (!rxnormApiKey) {
      console.error("RxNorm API Key is missing");
      return new Response(
        JSON.stringify({ error: "RxNorm API key not configured" }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const { operation, name, rxcui } = requestBody;
    console.log(`Processing ${operation} request`);

    if (!operation) {
      return new Response(
        JSON.stringify({ error: "Operation parameter is required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let apiUrl: string;
    switch (operation) {
      case "rxcui":
        if (!name) {
          return new Response(
            JSON.stringify({ error: "Name parameter is required for rxcui operation" }),
            { status: 400, headers: corsHeaders }
          );
        }
        apiUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`;
        break;
        
      case "interactions":
        if (!rxcui) {
          return new Response(
            JSON.stringify({ error: "RxCUI parameter is required for interactions operation" }),
            { status: 400, headers: corsHeaders }
          );
        }
        apiUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`;
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid operation" }),
          { status: 400, headers: corsHeaders }
        );
    }

    console.log(`Making request to RxNorm API: ${apiUrl}`);

    try {
      const response = await fetchWithTimeout(
        apiUrl,
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
      console.error('RxNorm API request error:', error);
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
      return new Response(
        JSON.stringify({ 
          error: "RxNorm API request failed",
          details: error.message
        }),
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

  } catch (error) {
    console.error("Unhandled error in RxNorm Edge Function:", error);
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
