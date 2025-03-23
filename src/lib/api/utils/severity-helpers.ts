
/**
 * Assigns weight to each severity level for confidence score calculation
 */
export function getConfidenceWeight(severity: "severe" | "moderate" | "minor" | "safe" | "unknown"): number {
  switch (severity) {
    case "severe":
      return 10;
    case "moderate":
      return 5;
    case "minor":
      return 3;
    case "safe":
      return 1;
    case "unknown":
    default:
      return 0;
  }
}

/**
 * Determines the most severe severity level from an array of severities
 */
export function getMostSevereSeverity(severities: ("safe" | "minor" | "moderate" | "severe" | "unknown")[]): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  if (severities.includes("severe")) return "severe";
  if (severities.includes("moderate")) return "moderate";
  if (severities.includes("minor")) return "minor";
  if (severities.includes("safe")) return "safe";
  return "unknown";
}

/**
 * Generates a human-readable description of the combined severity
 */
export function generateCombinedDescription(
  severity: "severe" | "moderate" | "minor" | "safe" | "unknown",
  interactionCount: number,
  severityCounts: Record<string, number>
): string {
  const totalInteractions = interactionCount;
  
  switch (severity) {
    case "severe":
      return `Taking all these medications together poses serious risks. ${severityCounts.severe} out of ${totalInteractions} medication pairs have severe interaction warnings that could lead to dangerous effects on your health.`;
      
    case "moderate":
      return `Caution is advised when taking all these medications together. ${severityCounts.moderate} out of ${totalInteractions} medication pairs have moderate interaction warnings that may require dose adjustments or monitoring.`;
      
    case "minor":
      return `Minimal interaction concerns when taking these medications together. ${severityCounts.minor} out of ${totalInteractions} medication pairs have minor interaction warnings that generally don't require medical intervention but should be monitored.`;
      
    case "safe":
      return `No significant interactions detected between these medications. All ${totalInteractions} medication pairs appear to be safe to take together based on available data.`;
      
    case "unknown":
    default:
      return `Limited data is available about how these medications interact when taken together. Please review the individual medication interactions and consult your healthcare provider.`;
  }
}
