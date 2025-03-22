
import { InteractionResult, InteractionSource } from '../types';

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

  // Group sources by name to handle deduplication properly
  const sourceGroups = new Map<string, InteractionSource[]>();
  
  // Collect all sources from all interactions and group them by name
  sortedInteractions.forEach(interaction => {
    // Sort sources by name for deterministic processing
    const sortedSources = [...interaction.sources].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedSources.forEach(source => {
      if (!sourceGroups.has(source.name)) {
        sourceGroups.set(source.name, []);
      }
      sourceGroups.get(source.name)!.push(source);
    });
  });
  
  // Merge sources from the same origin (e.g., FDA, OpenFDA, etc.)
  const mergedSources: InteractionSource[] = [];
  
  // Process source groups in alphabetical order for consistency
  const sortedSourceNames = Array.from(sourceGroups.keys()).sort();
  
  for (const sourceName of sortedSourceNames) {
    // Skip sources with no data
    if (sourceName === "No Data Available" || sourceName === "Unknown") {
      continue;
    }
    
    const sources = sourceGroups.get(sourceName)!;
    
    // If we only have one source of this type, add it directly
    if (sources.length === 1) {
      mergedSources.push(sources[0]);
      continue;
    }
    
    // When we have multiple sources of the same type, merge them
    const mergedSource: InteractionSource = {
      name: sourceName,
      // Take the highest severity as the overall severity for this source
      severity: getMostSevereSeverity(sources.map(s => s.severity)),
      // Create a combined description or use the first one
      description: sources[0].description,
      // Average the confidence values if available
      confidence: Math.round(sources.reduce((sum, s) => sum + (s.confidence || 0), 0) / sources.length)
    };
    
    // Add event data if available (from OpenFDA Adverse Events)
    if (sources.some(s => s.eventData)) {
      const eventData = {
        totalEvents: 0,
        seriousEvents: 0,
        nonSeriousEvents: 0
      };
      
      sources.forEach(s => {
        if (s.eventData) {
          eventData.totalEvents += s.eventData.totalEvents || 0;
          eventData.seriousEvents += s.eventData.seriousEvents || 0;
          eventData.nonSeriousEvents += s.eventData.nonSeriousEvents || 0;
        }
      });
      
      mergedSource.eventData = eventData;
    }
    
    mergedSources.push(mergedSource);
  }
  
  // Extract key warnings from all interactions
  const allWarnings: string[] = [];
  sortedInteractions.forEach(interaction => {
    if (interaction.severity === "severe" || interaction.severity === "moderate") {
      // Extract first sentence or up to 100 chars from description
      const mainWarning = extractMainWarning(interaction.description, interaction.medications);
      if (mainWarning && !allWarnings.includes(mainWarning)) {
        allWarnings.push(mainWarning);
      }
    }
  });
  
  // Sort warnings alphabetically for consistency
  allWarnings.sort();
  
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

/**
 * Assigns weight to each severity level for confidence score calculation
 */
function getConfidenceWeight(severity: "severe" | "moderate" | "minor" | "safe" | "unknown"): number {
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
 * Extracts a concise warning from a longer description
 */
function extractMainWarning(description: string, medications: string[]): string {
  if (!description) return "";
  
  // Try to get the first sentence
  const sentences = description.split(/[.!?][\s\n]/);
  let warning = sentences[0];
  
  // If it's too long, truncate it
  if (warning.length > 120) {
    warning = warning.substring(0, 120) + "...";
  }
  
  // Add medication names for context if they're not already mentioned
  if (medications.length === 2) {
    const medsPattern = new RegExp(medications.join('|'), 'i');
    if (!medsPattern.test(warning)) {
      warning = `When taking ${medications.join(' with ')}: ${warning}`;
    }
  }
  
  return warning;
}

/**
 * Determines the most severe severity level from an array of severities
 */
function getMostSevereSeverity(severities: ("safe" | "minor" | "moderate" | "severe" | "unknown")[]): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  if (severities.includes("severe")) return "severe";
  if (severities.includes("moderate")) return "moderate";
  if (severities.includes("minor")) return "minor";
  if (severities.includes("safe")) return "safe";
  return "unknown";
}

/**
 * Generates a human-readable description of the combined severity
 */
function generateCombinedDescription(
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
