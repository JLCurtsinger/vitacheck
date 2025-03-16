// Severity extraction and processing utilities
// Extracts the severity level from OpenAI's response text
// Improved to prioritize explicit severity statements and avoid false positives
export function extractSeverity(responseText: string): "safe" | "minor" | "moderate" | "severe" | "unknown" {
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
export function determineHighestSeverity(
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
export function extractEvidence(responseText: string): string {
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
export function selectModelForQuery(med1: string, med2: string): string {
  // Use GPT-3.5 for simpler queries to improve response time
  if ((med1.length + med2.length) <= 15) {
    return "gpt-3.5-turbo";
  }
  // Use GPT-4o-mini for more complex queries
  return "gpt-4o-mini";
}
