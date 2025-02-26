
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const handler: Handler = async (event) => {
  console.log('Received openFDA request:', {
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
    console.log('Processing openFDA request:', { query });

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
      const fdaUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(query.trim())}&limit=10`;
      console.log('Sending request to openFDA API:', fdaUrl);
      
      const response = await fetch(fdaUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.text();
      console.log('openFDA API response status:', response.status);
      console.log('openFDA API response headers:', response.headers);
      console.log('openFDA API response body:', responseData);

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: `openFDA API error (${response.status})`,
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
        console.error('Failed to parse openFDA response as JSON:', e);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: "Invalid JSON response from openFDA API",
            details: responseData,
            status: "error"
          })
        };
      }

      // Extract and structure relevant information
      const structuredResults = data.results?.map(result => ({
        safetyReportId: result.safetyreportid,
        receiveDate: result.receivedate,
        seriousnessDeath: result.serious,
        drugCharacterization: result.drugcharacterization,
        medicinalProduct: result.medicinalproduct,
        reactionMedDRApt: result.reactionmeddrapt
      })) || [];

      // Return structured response
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "success",
          data: {
            reports: structuredResults,
            query: query,
            total: data.meta?.results?.total || 0
          }
        })
      };

    } catch (error) {
      console.error('Error making request to openFDA API:', error);
      throw error;
    }

  } catch (error) {
    console.error("Unhandled error in openFDA function:", error);
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
