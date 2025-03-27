/**
 * Severity Determiner
 * 
 * This module determines the final severity based on weighted votes.
 */

/**
 * Determines the final severity based on weighted votes and special conditions
 */
export function determineFinalSeverity(
  severityVotes: Record<string, number>,
  sourceWeights: { source: any, weight: number }[]
): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  // First check if we have any "severe" votes from high-confidence sources
  const hasSevereFromHighConfidence = sourceWeights.some(({ source, weight }) => 
    source.severity === "severe" && weight >= 0.6);
    
  if (severityVotes.severe > 0 && hasSevereFromHighConfidence) {
    return "severe";
  }
  
  // Otherwise determine by highest weighted vote
  // Process severity keys in a fixed order for deterministic results
  const severityKeys: ("severe" | "moderate" | "minor" | "safe" | "unknown")[] = ["severe", "moderate", "minor", "safe", "unknown"];
  
  let finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  let maxVote = 0;
  
  for (const severity of severityKeys) {
    if (severityVotes[severity] > maxVote) {
      maxVote = severityVotes[severity];
      finalSeverity = severity;
    }
  }
  
  return finalSeverity;
}
