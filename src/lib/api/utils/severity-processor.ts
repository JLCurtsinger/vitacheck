
/**
 * Severity Processor
 * 
 * This module processes severity data from various sources to determine a final
 * interaction severity rating.
 */

import { InteractionSource, AdverseEventData, StandardizedApiResponse } from '../types';
import { calculateConsensusScore } from './consensus-system';

/**
 * Creates a default source when no data is available
 */
export function createDefaultSource(): InteractionSource {
  return {
    name: "No Data Available",
    severity: "unknown",
    description: "No interaction data available for this medication combination."
  };
}

/**
 * Determines the final severity rating based on multiple data sources
 */
export function determineFinalSeverity(
  rxnormResult: StandardizedApiResponse | null,
  suppaiResult: StandardizedApiResponse | null,
  fdaResult: StandardizedApiResponse | null,
  adverseEventsResult: AdverseEventData | null,
  sources: InteractionSource[]
): {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  confidenceScore: number;
  aiValidated: boolean;
} {
  // Use the consensus-based approach to calculate the final severity
  return calculateConsensusScore(sources, adverseEventsResult);
}

