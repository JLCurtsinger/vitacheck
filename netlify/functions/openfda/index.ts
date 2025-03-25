
import { Handler } from '@netlify/functions';
import { corsHeaders } from './constants';
import { fetchDrugLabelInfo, fetchAdverseEventData } from './services/fda-service';

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

    // First, get drug label information for nutrient depletions
    const { nutrientDepletions } = await fetchDrugLabelInfo(query);

    // Now get adverse event data
    const { reports, total, commonReactions, error } = await fetchAdverseEventData(query);
    
    if (error) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error,
          status: "error",
          nutrientDepletions
        })
      };
    }

    // Return structured response with both nutrient depletions and adverse event data
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: "success",
        data: {
          reports,
          query,
          total,
          nutrientDepletions,
          commonReactions
        }
      })
    };

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
