
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

interface RxNormEndpoint {
  path: string;
  params: Record<string, string>;
}

function buildRxNormUrl(endpoint: RxNormEndpoint): string {
  const baseUrl = "https://rxnav.nlm.nih.gov/REST";
  const apiKey = process.env.VITE_RXNORM_API_KEY;
  
  if (!apiKey) {
    throw new Error("RxNorm API key not found in environment variables");
  }
  
  const queryParams = new URLSearchParams({
    ...endpoint.params,
    apiKey
  });
  
  return `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
}

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Request body is required" })
      };
    }

    const { operation, name, rxcui } = JSON.parse(event.body);
    console.log(`Processing ${operation} request:`, { name, rxcui });

    if (!operation) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Operation parameter is required" })
      };
    }

    let endpoint: RxNormEndpoint;
    
    switch (operation) {
      case "rxcui":
        if (!name) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: "Name parameter is required for rxcui operation" })
          };
        }
        endpoint = {
          path: "/rxcui.json",
          params: { name }
        };
        break;
      case "interactions":
        if (!rxcui) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: "RxCUI parameter is required for interactions operation" })
          };
        }
        endpoint = {
          path: "/interaction/interaction.json",
          params: { rxcui }
        };
        break;
      default:
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: "Invalid operation" })
        };
    }

    const rxnormUrl = buildRxNormUrl(endpoint);
    console.log(`Fetching RxNorm data from: ${rxnormUrl}`);
    
    const response = await fetch(rxnormUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`RxNorm API error (${response.status}):`, errorText);
      
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: `RxNorm API error (${response.status})`,
          details: errorText || response.statusText
        })
      };
    }
    
    const data = await response.json();
    console.log(`RxNorm API response:`, data);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("Error in RxNorm proxy:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack
      })
    };
  }
};

export { handler };
