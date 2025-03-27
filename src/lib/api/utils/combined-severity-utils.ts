
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
  console.log(`Processing combined severity for ${interactions?.length || 0} interactions`);
  
  // Add defensive check for empty or undefined interactions array
  if (!interactions || interactions.length === 0) {
    console.warn("Empty interactions array passed to processCombinedSeverity");
    return {
      severity: "unknown" as const,
      description: "No interaction data available",
      confidenceScore: 0,
      sources: [{
        name: "No Data Available",
        severity: "unknown" as const,
        description: "No interaction data available"
      }],
      combinedWarnings: []
    };
  }
  
  // Filter out invalid interactions
  const validInteractions = interactions.filter(interaction => 
    interaction && interaction.severity !== undefined && interaction.sources && interaction.sources.length > 0
  );

  console.log(`Filtered ${interactions.length} interactions to ${validInteractions.length} valid interactions`);
  
  // If no valid interactions, return a fallback
  if (validInteractions.length === 0) {
    console.warn("No valid interactions after filtering");
    return {
      severity: "unknown" as const,
      description: "Unable to determine interaction severity from available data",
      confidenceScore: 0,
      sources: [{
        name: "No Data Available",
        severity: "unknown" as const,
        description: "No valid interaction data available"
      }],
      combinedWarnings: []
    };
  }
  
  // Track counts of each severity level
  const severityCounts = {
    severe: 0,
    moderate: 0,
    minor: 0,
    safe: 0,
    unknown: 0
  };
  
  // Sort interactions by medication names for deterministic processing
  const sortedInteractions = [...validInteractions].sort((a, b) => {
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
  const allSources = sortedInteractions.flatMap(interaction => interaction.sources || []);
  
  // Ensure we have at least one source
  if (allSources.length === 0) {
    allSources.push({
      name: "No Data Available",
      severity: combinedSeverity,
      description: "No source data available"
    });
  }
  
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
  
  console.log(`Combined severity result: ${combinedSeverity}, confidence: ${combinedConfidenceScore}, sources: ${mergedSources.length}`);
  
  return {
    severity: combinedSeverity,
    description,
    confidenceScore: combinedConfidenceScore,
    sources: mergedSources,
    combinedWarnings: allWarnings
  };
}
