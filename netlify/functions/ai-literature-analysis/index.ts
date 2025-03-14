
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Mock AI analysis function - in production, this would call GPT-o3-mini
async function analyzeInteraction(med1: string, med2: string): Promise<{
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  evidence: string;
} | null> {
  // This is a simplified mock that would be replaced with actual GPT-o3-mini API call
  console.log(`Analyzing interaction between ${med1} and ${med2}`);
  
  try {
    // In a real implementation, this would call the LLM API
    // const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    // ... make API call to GPT-o3-mini ...
    
    // For demonstration, we'll return mock data based on medication names
    const knownInteractions: Record<string, any> = {
      'ibuprofen+aspirin': {
        severity: 'moderate',
        description: 'Combining NSAIDs like ibuprofen and aspirin may increase risk of gastrointestinal bleeding.',
        evidence: 'Multiple clinical studies have demonstrated increased GI bleeding risk when NSAIDs are combined.'
      },
      'warfarin+aspirin': {
        severity: 'severe',
        description: 'This combination significantly increases bleeding risk and should be avoided unless medically supervised.',
        evidence: 'Clinical data shows substantially elevated INR values and bleeding events when these medications are combined.'
      },
      'lisinopril+potassium': {
        severity: 'moderate',
        description: 'ACE inhibitors like lisinopril can cause potassium retention; additional supplementation may lead to hyperkalemia.',
        evidence: 'Case reports and physiological mechanism support this interaction.'
      }
    };
    
    // Create a key by combining medication names (both orders)
    const key1 = `${med1.toLowerCase()}+${med2.toLowerCase()}`;
    const key2 = `${med2.toLowerCase()}+${med1.toLowerCase()}`;
    
    if (knownInteractions[key1]) {
      return knownInteractions[key1];
    } else if (knownInteractions[key2]) {
      return knownInteractions[key2];
    }
    
    // Default response if no specific interaction is known
    return {
      severity: 'unknown',
      description: 'Limited literature data available for this combination.',
      evidence: 'AI analysis found insufficient clinical evidence to determine interaction severity.'
    };
  } catch (error) {
    console.error('Error in mock LLM analysis:', error);
    return null;
  }
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
    
    if (!result) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Could not analyze interaction",
          status: "error"
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
