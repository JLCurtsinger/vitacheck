
/**
 * Utility for detecting interaction severity from text descriptions
 */

/**
 * Analyzes a description for keywords indicating severe interactions
 * @param description - The text to analyze
 * @returns Whether the description indicates a severe interaction
 */
export function detectSeverityFromDescription(description: string): "severe" | "minor" {
  // Look for severe keywords in the description
  const severeKeywords = ['severe', 'dangerous', 'fatal', 'death', 'avoid', 'contraindicated', 'life-threatening'];
  const isSevere = severeKeywords.some(keyword => description.toLowerCase().includes(keyword));
  
  return isSevere ? "severe" : "minor";
}
