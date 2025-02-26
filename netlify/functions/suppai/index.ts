
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const handler: Handler = async (event) => {
  console.log('Received SUPP.AI request:', {
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

    const { query } = JSON.parse(event.body);
    console.log('Processing SUPP.AI request:', { query });

    if (!query) {
      console.error('Query parameter is missing');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Query parameter is required",
          status: "error"
        })
      };
    }

    try {
      const suppAiUrl = `https://supp.ai/api?q=${encodeURIComponent(query.trim())}`;
      console.log('Sending request to SUPP.AI API:', suppAiUrl);
      
      const response = await fetch(suppAiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.text();
      console.log('SUPP.AI API response status:', response.status);
      console.log('SUPP.AI API response headers:', response.headers);
      console.log('SUPP.AI API response body:', responseData);

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: `SUPP.AI API error (${response.status})`,
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
        console.error('Failed to parse SUPP.AI response as JSON:', e);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: "Invalid JSON response from SUPP.AI API",
            details: responseData,
            status: "error"
          })
        };
      }

      // Return structured response
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "success",
          data: {
            interactions: data.interactions || [],
            query: query
          }
        })
      };

    } catch (error) {
      console.error('Error making request to SUPP.AI API:', error);
      throw error;
    }

  } catch (error) {
    console.error("Unhandled error in SUPP.AI function:", error);
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
