
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
  const url = `${baseUrl}${endpoint.path}?${queryParams.toString()}`;
  console.log('Built RxNorm API URL:', url);
  return url;
}

const handler: Handler = async (event) => {
  console.log('Received request:', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body
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
      console.error('Request validation failed: Missing body');
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
      console.error('Request validation failed: Missing operation');
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
          console.error('Request validation failed: Missing name for rxcui operation');
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
          console.error('Request validation failed: Missing rxcui for interactions operation');
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ 
              error: "RxCUI parameter is required for interactions operation",
              status: "error"
            })
          };
        }
        // Updated to use the correct interaction endpoint
        endpoint = {
          path: "/interaction/list.json",
          params: { rxcuis: rxcui.toString() }
        };
        break;
      default:
        console.error('Request validation failed: Invalid operation', operation);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: `Invalid operation: ${operation}`,
            status: "error"
          })
        };
    }

    try {
      const rxnormUrl = buildRxNormUrl(endpoint);
      console.log(`Making ${operation} request to RxNorm API:`, {
        url: rxnormUrl,
        operation,
        parameters: endpoint.params
      });
      
      const response = await fetch(rxnormUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.text();
      console.log('RxNorm API response:', {
        status: response.status,
        url: rxnormUrl,
        operation,
        responseData
      });

      if (!response.ok) {
        console.error('RxNorm API error:', {
          status: response.status,
          url: rxnormUrl,
          operation,
          response: responseData,
          requestBody: event.body
        });
        
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
        // Add detailed logging of the response for debugging
        console.log('RxNorm interaction response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Failed to parse RxNorm response:', {
          error: e instanceof Error ? e.message : 'Unknown error',
          operation,
          response: responseData,
          requestBody: event.body
        });
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
      if (!data) {
        console.log('No data returned from RxNorm API:', {
          operation,
          url: rxnormUrl
        });
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            status: "success",
            data: operation === 'interactions' ? { fullInteractionTypeGroup: [] } : {},
            message: "No data found"
          })
        };
      }
      
      // For interactions, ensure fullInteractionTypeGroup is present in the response
      if (operation === 'interactions') {
        // Check if the response has the expected fullInteractionTypeGroup structure
        if (!data.fullInteractionTypeGroup) {
          console.log('No interactions found in RxNorm response:', {
            operation,
            url: rxnormUrl,
            data
          });
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              status: "success",
              data: { fullInteractionTypeGroup: [] },
              message: "No interactions found"
            })
          };
        }
        
        // Return the full response with interactions
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            status: "success",
            data: { fullInteractionTypeGroup: data.fullInteractionTypeGroup }
          })
        };
      }
      
      // For rxcui operation, handle expected response format
      if (operation === 'rxcui') {
        if (!data.idGroup?.rxnormId || data.idGroup.rxnormId.length === 0) {
          console.log('No RxCUI found in RxNorm response:', {
            operation,
            url: rxnormUrl,
            data
          });
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              status: "success",
              data,
              message: "No data found"
            })
          };
        }
      }

      // Return the response for other operations
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "success",
          data
        })
      };

    } catch (error) {
      console.error('RxNorm API request failed:', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : 'Unknown error',
        operation,
        requestBody: event.body
      });
      throw error;
    }

  } catch (error) {
    console.error("Unhandled error in RxNorm function:", {
      error: error instanceof Error ? { message: error.message, stack: error.stack } : 'Unknown error',
      requestBody: event.body
    });
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
        status: "error"
      })
    };
  }
};

export { handler };
