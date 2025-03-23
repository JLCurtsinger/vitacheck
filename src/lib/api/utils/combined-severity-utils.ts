
import { InteractionResult } from '../types';
import { getConfidenceWeight, getMostSevereSeverity, generateCombinedDescription } from './severity-helpers';
import { extractCombinedWarnings } from './warning-extractor';
import { mergeSources } from './source-merger';

/**
 * Processes multiple interaction results to determine the combined severity
 * for a set of medications taken together
 * 
 * @param interactions Array of pairwise interaction results
 * @returns Combined severity assessment
 */
export function processCombinedSeverity(interactions: InteractionResult[]) {
  // Track counts of each severity level
  const severityCounts = {
    severe: 0,
    moderate: 0,
    minor: 0,
    safe: 0,
    unknown: 0
  };
  
  // Sort interactions by medication names for deterministic processing
  const sortedInteractions = [...interactions].sort((a, b) => {
    const nameA = a.medications.join('+');
    const nameB = b.medications.join('+');
    return nameA.localeCompare(nameB);
  });
  
  // Count occurrences of each severity level
  sortedInteractions.forEach(interaction => {
    severityCounts[interaction.severity]++;
  });
  
  console.log('Combined severity processing counts:', severityCounts);
  
  // Determine overall severity (prioritize highest risk)
  let combinedSeverity: "severe" | "moderate" | "minor" | "safe" | "unknown" = "unknown";
  
  if (severityCounts.severe > 0) {
    combinedSeverity = "severe";
  } else if (severityCounts.moderate > 0) {
    combinedSeverity = "moderate";
  } else if (severityCounts.minor > 0) {
    combinedSeverity = "minor";
  } else if (severityCounts.safe > 0 && severityCounts.unknown === 0) {
    combinedSeverity = "safe";
  } else {
    combinedSeverity = "unknown";
  }
  
  // Calculate a weighted confidence score
  // We give more weight to higher severity interactions
  let totalWeightedConfidence = 0;
  let totalWeight = 0;
  
  sortedInteractions.forEach(interaction => {
    const weight = getConfidenceWeight(interaction.severity);
    if (interaction.confidenceScore !== undefined) {
      totalWeightedConfidence += interaction.confidenceScore * weight;
      totalWeight += weight;
    }
  });
  
  const combinedConfidenceScore = totalWeight > 0 
    ? Math.round(totalWeightedConfidence / totalWeight)
    : 50; // Default if no confidence scores available

  // Collect all sources from all interactions
  const allSources = sortedInteractions.flatMap(interaction => interaction.sources);
  
  // Merge sources from the same origin to avoid duplicates
  const mergedSources = mergeSources(allSources);
  
  // Extract key warnings from all interactions
  const allWarnings = extractCombinedWarnings(sortedInteractions);
  
  // Generate a description based on the combined severity
  const description = generateCombinedDescription(
    combinedSeverity, 
    sortedInteractions.length, 
    severityCounts
  );
  
  return {
    severity: combinedSeverity,
    description,
    confidenceScore: combinedConfidenceScore,
    sources: mergedSources,
    combinedWarnings: allWarnings
  };
}
