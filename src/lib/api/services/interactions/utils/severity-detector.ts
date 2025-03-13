
/**
 * Utility for detecting interaction severity from text descriptions
 */

/**
 * Analyzes a description for keywords indicating severe interactions
 * @param description - The text to analyze
 * @returns The severity level based on the description content
 */
export function detectSeverityFromDescription(description: string): "severe" | "moderate" | "minor" {
  if (!description) return "minor";
  
  const descriptionLower = description.toLowerCase();
  
  // Detect severe keywords that indicate life-threatening or dangerous situations
  const severeKeywords = [
    'fatal', 'death', 'life-threatening', 'contraindicated', 
    'dangerous combination', 'severe toxicity', 'do not combine'
  ];
  
  // Detect moderate risk keywords
  const moderateKeywords = [
    'severe', 'serious', 'significant', 'avoid', 'caution', 
    'warning', 'monitor closely', 'discontinue'
  ];
  
  // Check for severe risks first
  if (severeKeywords.some(keyword => descriptionLower.includes(keyword))) {
    return "severe";
  }
  
  // Then check for moderate risks
  if (moderateKeywords.some(keyword => descriptionLower.includes(keyword))) {
    return "moderate";
  }
  
  // Default to minor
  return "minor";
}
