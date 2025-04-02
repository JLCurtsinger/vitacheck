
// OpenAI interaction service

import { extractSeverity, extractEvidence, selectModelForQuery } from "../utils/severity-utils";

/**
 * Queries OpenAI to analyze medication interactions with improved reliability
 * and comprehensive context-building from all available API responses
 */
export async function analyzeInteraction(med1: string, med2: string): Promise<{
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  evidence: string;
  confidence?: number;
  sources?: string[];
  citations?: string[];
} | null> {
  console.log(`Querying AI for enhanced interaction analysis: ${med1} + ${med2}`);

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("Missing OpenAI API Key in environment variables");
      return {
        severity: "unknown",
        description: "API configuration error: OpenAI API key not available",
        evidence: "Configuration error"
      };
    }

    // Enhanced system prompt with clearer instructions about the purpose
    const systemPrompt = `You are an AI assistant specializing in pharmaceutical interactions. 
    Your role is to:
    1. Analyze the interaction between the two medications provided
    2. Review all available API data (even if some sources are missing or incomplete)
    3. Identify patterns, contradictions, or notable signals across data sources
    4. Flag any inconsistencies between sources
    5. Provide practical insights to help interpret the risk
    
    You are NOT expected to be a standalone data source, but rather an analyst of other sources.
    If data is limited, acknowledge that but still provide your best analysis.
    
    Always format your response to begin with "Severity level: [level]" where [level] is one of: 
    safe, minor, moderate, severe, or unknown (only if truly insufficient data).`;

    // Enhanced user prompt that incorporates more context
    const userPrompt = `Analyze the potential interaction between ${med1} and ${med2} based on medical literature and available data.
    
    In your response:
    1. Clearly state the severity level as one of: safe, minor, moderate, severe, or unknown
    2. Provide a concise explanation of the interaction mechanism (if known)
    3. Mention any specific risk factors or patient populations of concern
    4. Note any contradictions between different data sources if present
    5. Cite evidence from medical literature where possible
    
    Format your response to be clear and clinically relevant.
    Begin with "Severity level: [level]" where [level] is one of safe, minor, moderate, severe, or unknown.
    
    If you identify any conflicts between data sources (e.g. RxNorm says severe, but FDA says minor),
    please note which source you believe is more reliable and why.
    
    If data is limited or missing, acknowledge that but still provide your best assessment based on 
    known pharmacological principles and available evidence.`;

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
          max_tokens: 500,
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
          description: "An error occurred while analyzing the interaction. Please refer to other data sources while we resolve this issue.",
          evidence: `AI analysis service temporarily unavailable: ${response.status} error`
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
          description: "The AI analysis service returned an invalid response format. Please rely on other data sources for this interaction.",
          evidence: "Invalid response format"
        };
      }
      
      // Validate the response structure
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error("Unexpected AI response format:", data);
        return {
          severity: "unknown",
          description: "The AI analysis provided an unexpected response format. Please rely on other data sources for this interaction.",
          evidence: "Unexpected response format"
        };
      }
      
      const aiResponse = data.choices[0].message.content;
      
      if (!aiResponse) {
        console.error("No valid content in OpenAI response");
        return {
          severity: "unknown",
          description: "The AI analysis did not return any content. Please rely on other data sources for this interaction.",
          evidence: "Empty response"
        };
      }

      console.log("AI response received:", aiResponse.substring(0, 100) + "...");
      
      // Extract the severity level from the AI response
      const severity = extractSeverity(aiResponse);
      const evidence = extractEvidence(aiResponse);
      
      // Extract source citations if present
      const citationRegex = /\[([\d,\s]+)\]/g;
      const citations = [];
      let match;
      while ((match = citationRegex.exec(aiResponse)) !== null) {
        citations.push(match[0]);
      }
      
      // Identify which sources were cited/referenced
      const sourcesReferenced = [];
      const sourceKeywords = {
        "RxNorm": ["rxnorm", "drug interaction", "ndf-rt"],
        "FDA": ["fda", "label", "boxed warning", "black box"],
        "SUPP.AI": ["suppai", "supplement", "natural", "herb"],
        "OpenFDA": ["adverse event", "side effect", "reported cases", "event count"],
        "Literature": ["study", "trial", "publication", "journal", "evidence"]
      };
      
      // Check which sources were referenced
      for (const [source, keywords] of Object.entries(sourceKeywords)) {
        if (keywords.some(keyword => aiResponse.toLowerCase().includes(keyword))) {
          sourcesReferenced.push(source);
        }
      }
      
      // Calculate a confidence score based on response quality
      // Start with base confidence then adjust
      let confidenceScore = 70;
      
      // Reduce confidence for vague responses
      if (aiResponse.length < 100) confidenceScore -= 20;
      if (severity === "unknown") confidenceScore -= 15;
      if (!evidence || evidence === "Analysis based on available information") confidenceScore -= 10;
      
      // Increase confidence for detailed, evidence-based responses
      if (aiResponse.toLowerCase().includes("study") || 
          aiResponse.toLowerCase().includes("trial")) confidenceScore += 10;
      if (aiResponse.toLowerCase().includes("mechanism")) confidenceScore += 5;
      if (citations.length > 0) confidenceScore += 15;
      if (sourcesReferenced.length >= 2) confidenceScore += 10;
      
      // Cap confidence between 0-100
      confidenceScore = Math.max(0, Math.min(100, confidenceScore));

      return {
        severity,
        description: aiResponse,
        evidence,
        confidence: confidenceScore,
        sources: sourcesReferenced.length > 0 ? sourcesReferenced : undefined,
        citations: citations.length > 0 ? citations : undefined
      };

    } catch (error) {
      // Clear timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Check if this was an abort error (timeout)
      if (error.name === 'AbortError') {
        console.error("OpenAI request aborted due to timeout");
        return {
          severity: "unknown",
          description: "The AI analysis timed out. This may be due to high server load or a complex query. Please rely on other data sources for this interaction while we work to improve response times.",
          evidence: "Analysis timed out",
          confidence: 0
        };
      }
      
      console.error("Error in OpenAI API call:", error);
      return {
        severity: "unknown",
        description: "An unexpected error occurred during the AI analysis. Please rely on other data sources for this interaction.",
        evidence: "Error: " + error.message,
        confidence: 0
      };
    }
  } catch (error) {
    console.error("Unexpected error in analyzeInteraction:", error);
    return {
      severity: "unknown",
      description: "An unexpected error occurred during the AI literature analysis. Please rely on other data sources.",
      evidence: "Error: " + error.message,
      confidence: 0
    };
  }
}
