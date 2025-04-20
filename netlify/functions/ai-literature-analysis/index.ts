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
            evidence: "AI analysis unavailable",
            confidence: 0
          }
        })
      };
    }
    
    // New: Calculate confidence score based on response quality
    let confidenceScore = result.confidence || 50;
    
    // New: Apply confidence penalties for issue indicators
    if (result.description?.includes("error occurred")) confidenceScore -= 30;
    if (result.description?.includes("timed out")) confidenceScore -= 25;
    if (result.description?.length < 50) confidenceScore -= 20;
    if (result.severity === "unknown") confidenceScore -= 15;
    
    // New: Apply confidence bonuses for quality indicators
    if (result.description?.includes("study") || result.description?.includes("clinical")) confidenceScore += 10;
    if (result.description?.includes("evidence")) confidenceScore += 10;
    if (result.description?.includes("[") && result.description?.includes("]")) confidenceScore += 15; // Contains citations
    
    // Cap confidence between 0-100
    confidenceScore = Math.max(0, Math.min(100, confidenceScore));
    
    // Add the confidence score to the result
    const enhancedResult = {
      ...result,
      confidence: confidenceScore
    };
    
    console.log(`AI analysis completed with confidence score: ${confidenceScore}%`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: "success",
        result: enhancedResult
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
          evidence: "Error: " + error.message,
          confidence: 0
        }
      })
    };
  }
};

export { handler };
