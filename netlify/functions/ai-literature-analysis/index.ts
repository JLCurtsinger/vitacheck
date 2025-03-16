
import { Handler } from '@netlify/functions';
import { corsHeaders } from './config/cors-config';
import { analyzeInteraction } from './services/openai-service';

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

    const { medications } = JSON.parse(event.body);
    
    if (!medications || !Array.isArray(medications) || medications.length < 2) {
      console.error('Invalid medications parameter');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Medications parameter must be an array with at least 2 items",
          status: "error"
        })
      };
    }

    const [med1, med2] = medications;
    console.log(`Processing AI analysis for: ${med1} + ${med2}`);
    
    const result = await analyzeInteraction(med1, med2);
    
    // Always return a response even if AI analysis fails
    if (!result) {
      console.log("AI analysis returned no result, returning unknown severity");
      return {
        statusCode: 200, // Return 200 even on AI failure to maintain API contract
        headers: corsHeaders,
        body: JSON.stringify({ 
          status: "success", // Still return success to prevent blocking API results
          result: {
            severity: "unknown",
            description: "Unable to analyze this interaction. Please refer to other data sources.",
            evidence: "AI analysis unavailable"
          }
        })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: "success",
        result
      })
    };

  } catch (error) {
    console.error("Unhandled error in AI literature analysis function:", error);
    // Still return a 200 status with unknown severity to maintain API contract
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        status: "success",
        result: {
          severity: "unknown",
          description: "An error occurred during analysis. Please refer to other data sources.",
          evidence: "Error: " + error.message
        }
      })
    };
  }
};

export { handler };
