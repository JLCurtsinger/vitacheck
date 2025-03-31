
import { Handler } from '@netlify/functions';
import { normalizeMedicationName } from '../../../src/lib/api/utils/name-normalizer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const handler: Handler = async (event) => {
  console.log('Received nutrient depletion logging request:', {
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

    const requestData = JSON.parse(event.body);
    console.log('Processing nutrient depletion request:', requestData);

    if (!requestData.medication_name || !requestData.depleted_nutrient || !requestData.source) {
      console.error('Required fields are missing');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Required fields missing: medication_name, depleted_nutrient, and source are required",
          status: "error"
        })
      };
    }

    // Normalize medication name
    const normalizedMedication = normalizeMedicationName(requestData.medication_name);

    // Call the Supabase Edge Function to handle the actual database operation
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl) {
      console.error('SUPABASE_URL environment variable is not defined');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "SUPABASE_URL environment variable is not defined",
          status: "error"
        })
      };
    }
    
    if (!supabaseKey) {
      console.error('SUPABASE_KEY environment variable is not defined');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "SUPABASE_KEY (service role key) environment variable is not defined",
          status: "error"
        })
      };
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/logNutrientDepletion`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        medication_name: normalizedMedication,
        depleted_nutrient: requestData.depleted_nutrient,
        source: requestData.source
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Error from Supabase Edge Function:', responseData);
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Error from Supabase Edge Function",
          details: responseData,
          status: "error"
        })
      };
    }

    console.log('Successfully processed nutrient depletion via Edge Function');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: "success",
        data: responseData
      })
    };

  } catch (error) {
    console.error("Unhandled error in logNutrientDepletion function:", error);
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
