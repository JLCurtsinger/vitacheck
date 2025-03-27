
/**
 * Confidence Score Calculator
 * 
 * This module calculates confidence scores for consensus results.
 */

import { InteractionSource } from '../../types';

/**
 * Calculates the confidence score based on vote distribution and source agreement
 */
export function calculateConfidenceScore(
  finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown",
  severityVotes: Record<string, number>,
  totalWeight: number,
  sourceWeights: { source: InteractionSource, weight: number }[],
  severityCounts: Record<string, number>,
  aiValidated: boolean
): number {
  // Calculate base confidence score (0-100%) based on the weighted average
  const primaryVote = severityVotes[finalSeverity];
  let confidenceScore = totalWeight > 0 ? Math.round((primaryVote / totalWeight) * 100) : 0;
  
  // Apply additional confidence adjustments
  if (sourceWeights.length >= 3) {
    confidenceScore = Math.min(100, confidenceScore + 5);
  }
  
  // Adjust confidence based on source agreement
  const allAgree = Object.values(severityCounts).filter(count => count > 0).length === 1;
  if (allAgree && sourceWeights.length > 1) {
    confidenceScore = Math.min(100, confidenceScore + 10);
  }
  
  // AI validation adjustment
  if (aiValidated && severityCounts[finalSeverity] > 1) {
    confidenceScore = Math.min(100, confidenceScore + 5);
  }
  
  return confidenceScore;
}
