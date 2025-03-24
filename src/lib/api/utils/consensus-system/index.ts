/**
 * Weighted Multi-Source Consensus System
 * 
 * This module implements a consensus-based approach to determining interaction severity
 * by weighing multiple data sources according to their reliability.
 */

import { InteractionSource, AdverseEventData } from '../../types';
import { determineSourceWeight } from './source-weight';
import { hasValidInteractionEvidence } from './source-validation';
import { determineConsensusDescription } from './description-generator';

// Threshold for considering a severe adverse event rate significant
const SEVERE_EVENT_THRESHOLD = 0.05; // 5% of total events

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

  let totalWeight = 0;
  let aiValidated = false;
  
  // Sort sources by name for deterministic processing order
  const sortedSources = [...sources].sort((a, b) => a.name.localeCompare(b.name));
  
  // Filter sources to only include those with valid interaction evidence
  const validSources = sortedSources.filter(hasValidInteractionEvidence);
  
  // If we have no valid sources, but have some sources, use all sources
  // This prevents completely blank results when only general information is available
  const sourcesToProcess = validSources.length > 0 ? validSources : sortedSources;
  
  // Process each source in deterministic order and collect their weights
  const sourceWeights: { source: InteractionSource, weight: number }[] = [];
  
  sourcesToProcess.forEach(source => {
    // Get the dynamic weight for this source based on evidence quality
    const weight = determineSourceWeight(source);
    
    // Only include sources with positive weight
    if (weight <= 0) return;
    
    sourceWeights.push({ source, weight });
    
    // Check if this is AI validation
    if (source.name === 'AI Literature Analysis') {
      aiValidated = true;
    }
  });

  // Calculate total weight from all valid sources
  totalWeight = sourceWeights.reduce((sum, item) => sum + item.weight, 0);
  
  // If no sources have weight, return unknown
  if (totalWeight === 0) {
    return {
      severity: "unknown",
      confidenceScore: 0,
      description: "Insufficient data to determine interaction severity.",
      aiValidated: false
    };
  }
  
  // Add weighted votes
  sourceWeights.forEach(({ source, weight }) => {
    severityVotes[source.severity] += weight;
    severityCounts[source.severity]++;
  });

  // Factor in adverse events data if available
  if (adverseEvents && adverseEvents.eventCount > 0) {
    const adverseEventWeight = 0.95; // High confidence for real-world data
    totalWeight += adverseEventWeight;
    
    // Calculate percentage of serious events
    const seriousPercentage = adverseEvents.seriousCount / adverseEvents.eventCount;
    
    if (seriousPercentage >= SEVERE_EVENT_THRESHOLD) {
      // Significant serious events -> severe
      severityVotes.severe += adverseEventWeight;
      severityCounts.severe++;
    } else if (adverseEvents.seriousCount > 0) {
      // Some serious events but below threshold -> moderate
      severityVotes.moderate += adverseEventWeight;
      severityCounts.moderate++;
    } else if (adverseEvents.eventCount > 10) {
      // Many non-serious events -> minor
      severityVotes.minor += adverseEventWeight;
      severityCounts.minor++;
    } else {
      // Few non-serious events -> considered safe
      severityVotes.safe += (adverseEventWeight * 0.5); // Half weight for this case
      severityCounts.safe++;
    }
  }

  // Determine the final severity based on weighted votes
  let finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  let maxVote = 0;

  // First check if we have any "severe" votes from high-confidence sources
  const hasSevereFromHighConfidence = sourceWeights.some(({ source, weight }) => 
    source.severity === "severe" && weight >= 0.6);
    
  if (severityVotes.severe > 0 && hasSevereFromHighConfidence) {
    finalSeverity = "severe";
  } else {
    // Otherwise determine by highest weighted vote
    // Process severity keys in a fixed order for deterministic results
    const severityKeys: (keyof typeof severityVotes)[] = ["severe", "moderate", "minor", "safe", "unknown"];
    
    for (const severity of severityKeys) {
      if (severityVotes[severity] > maxVote) {
        maxVote = severityVotes[severity];
        finalSeverity = severity;
      }
    }
  }

  // Calculate confidence score (0-100%) based on the weighted average
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
  
  // Generate a description that explains the consensus
  let description = determineConsensusDescription(finalSeverity, confidenceScore, sourcesToProcess, adverseEvents);

  return {
    severity: finalSeverity,
    confidenceScore,
    description,
    aiValidated
  };
}

// Re-export the utility functions for potential direct use
export {
  determineSourceWeight,
  hasValidInteractionEvidence,
  determineConsensusDescription
};
