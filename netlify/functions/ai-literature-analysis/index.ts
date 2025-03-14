
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

/**
 * Extracts the severity level from OpenAI's response text
 */
function extractSeverity(responseText: string): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  const lowerText = responseText.toLowerCase();
  
  // Check for explicit severity mentions
  if (lowerText.includes("severe") || 
      lowerText.includes("dangerous") || 
      lowerText.includes("contraindicated") || 
      lowerText.includes("high risk")) {
    return "severe";
  }
  
  if (lowerText.includes("moderate") || 
      lowerText.includes("significant") || 
      lowerText.includes("caution") || 
      lowerText.includes("monitor")) {
    return "moderate";
  }
  
  if (lowerText.includes("minor") || 
      lowerText.includes("mild") || 
      lowerText.includes("low risk") || 
      lowerText.includes("minimal")) {
    return "minor";
  }
  
  if (lowerText.includes("safe") || 
      lowerText.includes("no interaction") || 
      lowerText.includes("no known interaction") || 
      lowerText.includes("can be taken together")) {
    return "safe";
  }
  
  return "unknown";
}

/**
 * Queries OpenAI's o3-mini model to analyze medication interactions
 */
async function analyzeInteraction(med1: string, med2: string): Promise<{
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  evidence: string;
} | null> {
  console.log(`Querying OpenAI (gpt-4o-mini) for interaction analysis: ${med1} + ${med2}`);

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("Missing OpenAI API Key in environment variables");
      return null;
    }

    const systemPrompt = `You are an AI assistant specializing in pharmaceutical interactions. 
    Analyze the two medications provided and determine their interaction severity based on medical literature.
    Be thorough and clinical in your assessment.`;

    const userPrompt = `Analyze the potential interaction between ${med1} and ${med2} based on medical literature.
    Consider mechanism of action, pharmacokinetics, and clinical evidence.
    
    In your response:
    1. Clearly state the severity level as one of: safe, minor, moderate, severe, or unknown
    2. Provide a concise explanation of the interaction mechanism
    3. Mention any specific risk factors or patient populations of concern
    4. Cite evidence from medical literature where possible
    
    Format your response to be clear, clinical, and actionable.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "o3-mini",  // Using the correct model name format
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // Lower temperature ensures consistent, fact-based responses with minimal hallucinations.
        max_tokens: 700, // keep responses from being too long
        top_p: 0.4, // focuses on probable, factual responses 
        frequency_penalty: 0.3, //reduces repitiion in a single response
        presence_penalty: 0.0 //allows responses to be the same as previous responses
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}): ${errorText}`);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      console.error("No valid content in OpenAI response");
      return null;
    }

    console.log("AI response received:", aiResponse.substring(0, 100) + "...");
    
    // Extract the severity level from the AI response
    const severity = extractSeverity(aiResponse);
    
    // Find evidence section if available
    let evidence = "Based on AI analysis of medical literature";
    if (aiResponse.toLowerCase().includes("evidence:")) {
      const evidenceParts = aiResponse.split(/evidence:?/i);
      if (evidenceParts.length > 1) {
        evidence = evidenceParts[1].split('\n')[0].trim();
      }
    }

    return {
      severity,
      description: aiResponse,
      evidence
    };

  } catch (error) {
    console.error("Error in OpenAI API call:", error);
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
