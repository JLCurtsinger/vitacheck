
/**
 * Description Generator
 * 
 * This module generates human-readable descriptions of the consensus results.
 */

import { InteractionSource, AdverseEventData } from '../../types';

/**
 * Generates a description explaining how the consensus was reached
 */
export function determineConsensusDescription(
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown",
  confidenceScore: number,
  sources: InteractionSource[],
  adverseEvents: AdverseEventData | null | undefined
): string {
  // Get source names in a deterministic way (sorted alphabetically)
  const sourceList = sources
    .map(s => s.name)
    .filter(name => name !== 'No Data Available')
    .sort();
  
  // Base description on severity and confidence
  if (severity === "severe") {
    return `Severe interaction risk identified with ${confidenceScore}% confidence based on ${sourceList.join(', ')}. ${adverseEvents?.seriousCount ? `Real-world data shows ${adverseEvents.seriousCount} serious adverse events.` : ''}`;
  } else if (severity === "moderate") {
    return `Moderate interaction risk identified with ${confidenceScore}% confidence based on ${sourceList.join(', ')}. Monitor closely and consult a healthcare professional.`;
  } else if (severity === "minor") {
    return `Minor interaction potential with ${confidenceScore}% confidence based on ${sourceList.join(', ')}. Generally considered manageable.`;
  } else if (severity === "safe") {
    return `Verified safe to take together with ${confidenceScore}% confidence based on ${sourceList.length ? sourceList.join(', ') : 'available data'}.`;
  } else {
    return `Interaction status is uncertain (${confidenceScore}% confidence). Limited data available. Consult a healthcare professional.`;
  }
}
