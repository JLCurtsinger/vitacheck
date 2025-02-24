
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
  const queryParams = new URLSearchParams(endpoint.params);
  return `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
}

const handler: Handler = async (event) => {
  console.log('Received request:', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : null
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (!event.body) {
      console.error('Request body is missing');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Request body is required",
          status: "error"
        })
      };
    }

    const { operation, name, rxcui } = JSON.parse(event.body);
    console.log('Processing request:', { operation, name, rxcui });

    if (!operation) {
      console.error('Operation parameter is missing');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Operation parameter is required",
          status: "error"
        })
      };
    }

    let endpoint: RxNormEndpoint;
    
    switch (operation) {
      case "rxcui":
        if (!name) {
          console.error('Name parameter is missing for rxcui operation');
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: "Name parameter is required for rxcui operation",
              status: "error"
            })
          };
        }
        endpoint = {
          path: "/rxcui.json",
          params: { name: name.trim() }
        };
        break;
      case "interactions":
        if (!rxcui) {
          console.error('RxCUI parameter is missing for interactions operation');
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: "RxCUI parameter is required for interactions operation",
              status: "error"
            })
          };
        }
        // Expect the caller to provide a string with multiple RxCUIs joined by "+"
        endpoint = {
          path: "/interaction/list.json",
          params: { rxcuis: rxcui.toString() }
        };
        break;
      default:
        console.error(`Invalid operation requested: ${operation}`);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: "Invalid operation",
            status: "error"
          })
        };
    }

    try {
      const rxnormUrl = buildRxNormUrl(endpoint);
      console.log('Sending request to RxNorm API...');
      
      const response = await fetch(rxnormUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.text();
      console.log('RxNorm API response status:', response.status);
      console.log('RxNorm API response headers:', response.headers);
      console.log('RxNorm API response body:', responseData);

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: `RxNorm API error (${response.status})`,
            details: responseData || response.statusText,
            status: "error"
          })
        };
      }
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseData);
      } catch (e) {
        console.error('Failed to parse RxNorm response as JSON:', e);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: "Invalid JSON response from RxNorm API",
            details: responseData,
            status: "error"
          })
        };
      }

      // Handle empty or null responses gracefully
      if (!data || (operation === 'interactions' && (!data.fullInteractionTypeGroup || data.fullInteractionTypeGroup.length === 0))) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            status: "success",
            data: operation === 'interactions' ? { fullInteractionTypeGroup: [] } : data,
            message: "No data found"
          })
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "success",
          data
        })
      };

    } catch (error) {
      console.error('Error making request to RxNorm API:', error);
      throw error;  // Re-throw to be caught by outer try-catch
    }

  } catch (error) {
    console.error("Unhandled error in RxNorm function:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack,
        status: "error"
      })
    };
  }
};

export { handler };
