
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

/**
 * Extracts the severity level from OpenAI's response text
 * Improved to prioritize explicit severity statements and avoid false positives
 */
function extractSeverity(responseText: string): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  if (!responseText) return "unknown";
  
  const lowerText = responseText.toLowerCase();
  
  // First try to extract explicit severity level statements
  const severityRegex = /severity\s*(?:level)?(?:\s*is|\s*:)?\s*(safe|minor|moderate|severe|unknown)/i;
  const match = responseText.match(severityRegex);
  
  if (match && match[1]) {
    const explicitSeverity = match[1].toLowerCase();
    console.log(`Explicit severity found in response: "${explicitSeverity}"`);
    
    // Validate that it's one of our expected values
    if (['safe', 'minor', 'moderate', 'severe', 'unknown'].includes(explicitSeverity)) {
      return explicitSeverity as "safe" | "minor" | "moderate" | "severe" | "unknown";
    }
  }
  
  // If there's a clear indication of safety at the beginning of the response
  // (avoids being misled by descriptions of severe conditions that are being ruled out)
  const firstParagraph = lowerText.split('\n')[0];
  if (firstParagraph.includes("safe") && 
      !firstParagraph.includes("not safe") && 
      !firstParagraph.includes("unsafe")) {
    console.log("Safety mentioned in first paragraph, marking as safe");
    return "safe";
  }
  
  // Check for contradictions
  const containsSafe = lowerText.includes("safe") && 
                      !lowerText.includes("not safe") && 
                      !lowerText.includes("unsafe");
                      
  const containsSevere = lowerText.includes("severe") || 
                        lowerText.includes("dangerous") || 
                        lowerText.includes("contraindicated");
  
  if (containsSafe && containsSevere) {
    console.log("WARNING: Response contains both safe and severe indicators! Analyzing context...");
    
    // Check if safe appears in a conclusive statement
    if (lowerText.includes("conclusion: safe") || 
        lowerText.includes("in conclusion, these medications are safe") ||
        lowerText.includes("can be safely taken")) {
      console.log("Found conclusive safety statement, overriding contradiction");
      return "safe";
    }
  }
  
  // Fallback to keyword-based detection if explicit statement not found
  // Check for explicit severe keywords that indicate life-threatening situations
  const severeKeywords = [
    'fatal', 'death', 'life-threatening', 'contraindicated', 
    'dangerous combination', 'severe toxicity', 'do not combine'
  ];
  
  if (severeKeywords.some(keyword => lowerText.includes(keyword))) {
    return "severe";
  }
  
  // Check for moderate risk keywords
  const moderateKeywords = [
    'severe', 'serious', 'significant', 'avoid', 'caution', 
    'warning', 'monitor closely', 'discontinue'
  ];
  
  if (moderateKeywords.some(keyword => lowerText.includes(keyword))) {
    return "moderate";
  }
  
  // Check for minor risk keywords
  const minorKeywords = [
    'minor', 'mild', 'low risk', 'minimal'
  ];
  
  if (minorKeywords.some(keyword => lowerText.includes(keyword))) {
    return "minor";
  }
  
  // Check for safety keywords
  const safeKeywords = [
    'safe', 'no interaction', 'no known interaction', 'can be taken together'
  ];
  
  if (safeKeywords.some(keyword => lowerText.includes(keyword))) {
    return "safe";
  }
  
  return "unknown";
}

/**
 * Determines the highest severity level from a list of severity values
 */
function determineHighestSeverity(
  severities: ("safe" | "minor" | "moderate" | "severe" | "unknown")[]
): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  if (!severities.length) return "unknown";
  
  const severityRanking = {
    "severe": 4,
    "moderate": 3,
    "minor": 2,
    "unknown": 1,
    "safe": 0
  };
  
  let highestSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "safe";
  let highestRank = -1;
  
  for (const severity of severities) {
    if (severityRanking[severity] > highestRank) {
      highestRank = severityRanking[severity];
      highestSeverity = severity;
    }
  }
  
  return highestSeverity;
}

/**
 * Find evidence section in AI response
 */
function extractEvidence(responseText: string): string {
  if (!responseText) return "No evidence available";
  
  // Check for evidence section
  if (responseText.toLowerCase().includes("evidence:")) {
    const evidenceParts = responseText.split(/evidence:?/i);
    if (evidenceParts.length > 1) {
      const evidenceText = evidenceParts[1].split('\n')[0].trim();
      return evidenceText || "Based on AI analysis of medical literature";
    }
  }
  
  return "Based on AI analysis of medical literature";
}

/**
 * Dynamically choose model based on medication name complexity
 */
function selectModelForQuery(med1: string, med2: string): string {
  // Use GPT-3.5 for simpler queries to improve response time
  if ((med1.length + med2.length) <= 15) {
    return "gpt-3.5-turbo";
  }
  // Use GPT-4o-mini for more complex queries
  return "gpt-4o-mini";
}

/**
 * Queries OpenAI to analyze medication interactions with improved reliability and timeout handling
 */
async function analyzeInteraction(med1: string, med2: string): Promise<{
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  evidence: string;
} | null> {
  console.log(`Querying AI for interaction analysis: ${med1} + ${med2}`);

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("Missing OpenAI API Key in environment variables");
      return null;
    }

    const systemPrompt = `You are an AI assistant specializing in pharmaceutical interactions. 
    Analyze the two medications provided and determine their interaction severity based on medical literature.
    Be thorough and clinical in your assessment. Always include an explicit severity level classification.`;

    const userPrompt = `Analyze the potential interaction between ${med1} and ${med2} based on medical literature.
    Consider mechanism of action, pharmacokinetics, and clinical evidence.
    
    In your response:
    1. Clearly state the severity level as one of: safe, minor, moderate, severe, or unknown
    2. Provide a concise explanation of the interaction mechanism
    3. Mention any specific risk factors or patient populations of concern
    4. Cite evidence from medical literature where possible
    
    Format your response to be clear, clinical, and actionable.
    Begin your response with "Severity level: [level]" where [level] is one of safe, minor, moderate, severe, or unknown.`;

    // Set up timeout with AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("OpenAI request timeout after 9 seconds");
      controller.abort();
    }, 9000);

    // Select appropriate model based on query complexity
    const model = selectModelForQuery(med1, med2);
    console.log(`Using model ${model} for interaction analysis`);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 300, // Reduced from 500 to 300 to speed up responses
          temperature: 0.1 // Lower temperature for more consistent, fact-based responses
        }),
        signal: controller.signal // Enable timeout
      });

      // Clear timeout since we got a response
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error (${response.status}): ${errorText}`);
        return {
          severity: "unknown",
          description: "Error occurred while analyzing interaction",
          evidence: "AI analysis failed"
        };
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        console.error("No valid content in OpenAI response");
        return {
          severity: "unknown",
          description: "No valid response received from AI analysis",
          evidence: "AI analysis provided no content"
        };
      }

      console.log("AI response received:", aiResponse.substring(0, 100) + "...");
      
      // Extract the severity level from the AI response
      const severity = extractSeverity(aiResponse);
      const evidence = extractEvidence(aiResponse);
      
      // Log any contradictions for debugging
      if (severity === "safe" && aiResponse.toLowerCase().includes("severe")) {
        console.warn("CONTRADICTION: AI response mentions 'severe' but was classified as 'safe'");
        console.log("Full AI response for debugging:", aiResponse);
      } else if (severity === "severe" && aiResponse.toLowerCase().includes("safe")) {
        console.warn("CONTRADICTION: AI response mentions 'safe' but was classified as 'severe'");
        console.log("Full AI response for debugging:", aiResponse);
      }

      return {
        severity,
        description: aiResponse,
        evidence
      };

    } catch (error) {
      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Check if this was an abort error (timeout)
      if (error.name === 'AbortError') {
        console.error("OpenAI request aborted due to timeout");
        return {
          severity: "unknown",
          description: "The AI analysis timed out. Please rely on the other data sources for this interaction.",
          evidence: "Analysis timed out"
        };
      }
      
      console.error("Error in OpenAI API call:", error);
      return {
        severity: "unknown",
        description: "Error occurred while analyzing the interaction",
        evidence: "AI analysis failed with error: " + error.message
      };
    }
  } catch (error) {
    console.error("Unexpected error in analyzeInteraction:", error);
    return {
      severity: "unknown",
      description: "An unexpected error occurred during analysis",
      evidence: "Error: " + error.message
    };
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
