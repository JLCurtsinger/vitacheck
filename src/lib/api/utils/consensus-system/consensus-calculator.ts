
/**
 * Consensus Score Calculator
 * 
 * This module implements the core calculation logic for the consensus-based 
 * approach to determining interaction severity.
 */

import { InteractionSource, AdverseEventData } from '../../types';
import { processSourcesWithWeights } from './source-processor';
import { processAdverseEvents } from './adverse-event-processor';
import { calculateConfidenceScore } from './confidence-calculator';
import { determineFinalSeverity } from './severity-determiner';
import { determineConsensusDescription } from './description-generator';

/**
 * Calculates a weighted severity score based on multiple sources
 * 
 * @param sources Array of interaction sources with their severities
 * @param adverseEvents Optional adverse event data to factor in
 * @returns Object containing calculated severity and confidence score
 */
export function calculateConsensusScore(
  sources: InteractionSource[],
  adverseEvents: AdverseEventData | null | undefined
): {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidenceScore: number;
  description: string;
  aiValidated: boolean;
} {
  if (!sources.length) {
    return {
      severity: "unknown",
      confidenceScore: 0,
      description: "No data available to determine interaction severity.",
      aiValidated: false
    };
  }

  // Initialize counters for each severity level
  const severityCounts = {
    safe: 0,
    minor: 0,
    moderate: 0,
    severe: 0,
    unknown: 0
  };

  // Track weighted votes for each severity level
  const severityVotes = {
    safe: 0,
    minor: 0,
    moderate: 0,
    severe: 0,
    unknown: 0
  };

  // Process sources and get their weights
  const { sourceWeights, aiValidated, totalWeight } = processSourcesWithWeights(sources);
  
  // If no sources have weight, return unknown
  if (totalWeight === 0) {
    return {
      severity: "unknown",
      confidenceScore: 0,
      description: "Insufficient data to determine interaction severity.",
      aiValidated: false
    };
  }
  
  // Add weighted votes from source weights
  sourceWeights.forEach(({ source, weight }) => {
    // Safely handle severity - default to unknown if not present
    const severity = source.severity || "unknown";
    severityVotes[severity] += weight;
    severityCounts[severity]++;
  });

  // Factor in adverse events data if available
  const adverseEventData = processAdverseEvents(adverseEvents);
  if (adverseEventData) {
    const { weight, severity, count } = adverseEventData;
    severityVotes[severity] += weight;
    severityCounts[severity] += count;
  }

  // Determine the final severity based on weighted votes
  const finalSeverity = determineFinalSeverity(severityVotes, sourceWeights);

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(
    finalSeverity,
    severityVotes,
    totalWeight,
    sourceWeights,
    severityCounts,
    aiValidated
  );
  
  // Generate a description that explains the consensus
  const sourcesToProcess = sources.filter(source => source && source.name);
  const description = determineConsensusDescription(
    finalSeverity, 
    confidenceScore, 
    sourcesToProcess, 
    adverseEvents
  );

  return {
    severity: finalSeverity,
    confidenceScore,
    description,
    aiValidated
  };
}
