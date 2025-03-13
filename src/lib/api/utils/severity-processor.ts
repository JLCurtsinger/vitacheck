
/**
 * Severity Determination Utilities
 * 
 * This module handles severity determination and result processing for medication interactions.
 */

import { InteractionResult, InteractionSource, AdverseEventData } from '../types';

export type Severity = "safe" | "minor" | "severe" | "unknown";

/**
 * Determines the final severity and description based on all API responses
 */
export function determineFinalSeverity(
  rxnormResult: any,
  suppaiResult: any,
  fdaResult: any,
  adverseEventsResult: AdverseEventData | null,
  sources: InteractionSource[]
): {
  severity: Severity,
  description: string
} {
  // Track interaction statuses across all APIs
  let hasAnyInteraction = false;
  let hasExplicitSafety = false;
  let hasUnknownStatus = false;
  let mostSevereDescription = "No information found for this combination. Consult a healthcare provider for more details.";
  let mostSeverity: Severity = "unknown";

  // Analyze results from all APIs to determine overall severity
  for (const result of [rxnormResult, suppaiResult, fdaResult]) {
    if (!result) continue;
    
    // If any API reports an interaction, we consider there is an interaction
    if (result.severity === "minor" || result.severity === "severe") {
      hasAnyInteraction = true;
      
      // Track the most severe interaction and its description
      if (
        (result.severity === "severe") || 
        (result.severity === "minor" && mostSeverity !== "severe")
      ) {
        mostSeverity = result.severity;
        mostSevereDescription = result.description;
      }
    }
    
    // Track if any API explicitly confirms safety
    if (result.severity === "safe") {
      hasExplicitSafety = true;
    }
    
    // Track if any API returns unknown status
    if (result.severity === "unknown") {
      hasUnknownStatus = true;
    }
  }
  
  // If we have adverse events data, factor it into the severity determination
  if (adverseEventsResult && adverseEventsResult.eventCount > 0) {
    hasAnyInteraction = true;
    
    if (adverseEventsResult.seriousCount > 0) {
      if (mostSeverity !== "severe") {
        mostSeverity = "severe";
        mostSevereDescription = `Real-world data shows ${adverseEventsResult.eventCount} reported adverse events (including ${adverseEventsResult.seriousCount} serious cases) for this combination. Consult a healthcare provider before combining.`;
      }
    } else if (adverseEventsResult.eventCount > 5) {
      if (mostSeverity !== "severe") {
        mostSeverity = "minor";
        mostSevereDescription = `Real-world data shows ${adverseEventsResult.eventCount} reported adverse events for this combination. Monitor for side effects and consult a healthcare provider if concerned.`;
      }
    }
  }

  // Determine final result based on merged data
  let finalSeverity: Severity;
  let finalDescription: string;
  
  if (hasAnyInteraction) {
    // If any API reports an interaction, use the most severe level
    finalSeverity = mostSeverity;
    finalDescription = mostSevereDescription;
  } else if (hasExplicitSafety && !hasAnyInteraction) {
    // Only mark as safe if at least one API explicitly confirms safety and no API reports interactions
    finalSeverity = "safe";
    finalDescription = "Verified safe to take together based on available data. Always consult your healthcare provider.";
  } else {
    // Default case - no clear information available
    finalSeverity = "unknown";
    finalDescription = "No information found for this combination. Consult a healthcare provider for more details.";
  }

  return {
    severity: finalSeverity,
    description: finalDescription
  };
}

/**
 * Creates a default source if no sources are available
 */
export function createDefaultSource(): InteractionSource {
  return {
    name: "No Data Available",
    severity: "unknown",
    description: "No interaction data available from any source"
  };
}
