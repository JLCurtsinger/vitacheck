
// OpenAI interaction service

import { extractSeverity, extractEvidence, selectModelForQuery } from "../utils/severity-utils";

// Queries OpenAI to analyze medication interactions with improved reliability and timeout handling
export async function analyzeInteraction(med1: string, med2: string): Promise<{
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
          max_tokens: 350, // Reduced from 500 to 350 to speed up responses
          temperature: 0.1 // Lower temperature for more consistent, fact-based responses
        }),
        signal: controller.signal // Enable timeout
      });

      // Clear timeout since we got a response
      clearTimeout(timeoutId);

      // First check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error (${response.status}): ${errorText}`);
        return {
          severity: "unknown",
          description: "Error occurred while analyzing interaction",
          evidence: `AI analysis failed: ${response.status} error`
        };
      }

      // Get the raw response text first
      const rawResponse = await response.text();
      console.log("Raw OpenAI response (first 300 chars):", rawResponse.substring(0, 300) + "...");
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (error) {
        console.error("Failed to parse AI response as JSON:", error.message);
        console.error("Raw response that failed parsing:", rawResponse);
        return {
          severity: "unknown",
          description: "The AI response could not be processed correctly.",
          evidence: "Invalid JSON response from OpenAI"
        };
      }
      
      // Validate the response structure
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected AI response format:", data);
        return {
          severity: "unknown",
          description: "Unexpected AI response format. Please rely on other data sources.",
          evidence: "AI response was not in expected format"
        };
      }
      
      const aiResponse = data.choices[0].message.content;
      
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
