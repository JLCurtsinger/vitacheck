
/**
 * Weighted Multi-Source Consensus System
 * 
 * This module implements a consensus-based approach to determining interaction severity
 * by weighing multiple data sources according to their reliability.
 */

import { InteractionSource, AdverseEventData } from '../types';

// Fixed source confidence weights for deterministic results
const SOURCE_WEIGHTS = {
  'RxNorm': 0.9, // 90% confidence
  'FDA': 0.8,    // 80% confidence
  'SUPP.AI': 0.6, // 60% confidence
  'OpenFDA Adverse Events': 0.75, // 75% confidence
  'VitaCheck Safety Database': 0.95, // 95% confidence
  'No Data Available': 0.0, // 0% confidence
  'AI Literature Analysis': 0.5 // 50% confidence
};

// Threshold for considering a severe adverse event rate significant
const SEVERE_EVENT_THRESHOLD = 0.05; // 5% of total events

/**
 * Determines if a source contains meaningful interaction evidence
 * and should be included in confidence calculations
 */
function hasValidInteractionEvidence(source: InteractionSource): boolean {
  // Sources with no descriptions or "no data available" aren't valid
  if (!source.description || 
      source.name === 'No Data Available' || 
      source.severity === 'unknown') {
    return false;
  }
  
  // "No known interaction" responses should not affect confidence
  const noInteractionPhrases = [
    'no known interaction',
    'no interactions found',
    'no interaction data',
    'no evidence of interaction',
    'could not find any interaction'
  ];
  
  if (noInteractionPhrases.some(phrase => 
      source.description.toLowerCase().includes(phrase))) {
    return false;
  }
  
  // If source explicitly indicates safety without evidence, don't count it
  if (source.severity === 'safe' && 
      !source.description.toLowerCase().includes('evidence') &&
      !source.description.toLowerCase().includes('study')) {
    return false;
  }
  
  // Always include sources with actual adverse event data
  if (source.eventData && source.eventData.totalEvents > 0) {
    return true;
  }
  
  // Always include high-quality sources that identify specific interactions
  const interactionEvidencePhrases = [
    'adverse event',
    'clinical',
    'case report',
    'study found',
    'research shows',
    'trial',
    'evidence indicates',
    'reported',
    'interaction risk',
    'contraindicated',
    'statistical',
    'increased risk',
    'observed'
  ];
  
  // Check if description contains evidence of actual interaction data
  return interactionEvidencePhrases.some(phrase => 
    source.description.toLowerCase().includes(phrase));
}

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

  // Process each source in deterministic order
  sourcesToProcess.forEach(source => {
    // Get the weight for this source
    const weight = SOURCE_WEIGHTS[source.name] || 0.3; // Default to 30% if unknown source
    
    // Check if this is AI validation
    if (source.name === 'AI Literature Analysis') {
      aiValidated = true;
    }

    // Add weighted vote
    severityVotes[source.severity] += weight;
    severityCounts[source.severity]++;
    totalWeight += weight;
  });

  // Factor in adverse events data if available
  if (adverseEvents && adverseEvents.eventCount > 0) {
    const adverseEventWeight = SOURCE_WEIGHTS['OpenFDA Adverse Events'];
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
  let finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  let maxVote = 0;

  // First check if we have any "severe" votes from high-confidence sources
  if (severityVotes.severe > 0 && 
      (sourcesToProcess.some(s => s.severity === "severe" && (SOURCE_WEIGHTS[s.name] || 0) >= 0.8))) {
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

  // Calculate confidence score (0-100%) - with fixed rounding for consistency
  let confidenceScore = 0;
  if (totalWeight > 0) {
    // Base confidence on agreement between sources
    const primaryVote = severityVotes[finalSeverity!];
    confidenceScore = Math.min(100, Math.round((primaryVote / totalWeight) * 100));
    
    // Apply fixed confidence adjustments rather than dynamic ones
    if (sourcesToProcess.length >= 3) {
      confidenceScore = Math.min(100, confidenceScore + 10);
    }
    
    // Adjust confidence based on source agreement
    const allAgree = Object.values(severityCounts).filter(count => count > 0).length === 1;
    if (allAgree && sourcesToProcess.length > 1) {
      confidenceScore = Math.min(100, confidenceScore + 15);
    }
    
    // AI validation adjustment
    if (aiValidated && severityCounts[finalSeverity!] > 1) {
      confidenceScore = Math.min(100, confidenceScore + 10);
    }
  }

  // Generate a description that explains the consensus
  let description = determineConsensusDescription(finalSeverity!, confidenceScore, sourcesToProcess, adverseEvents);

  return {
    severity: finalSeverity!,
    confidenceScore,
    description,
    aiValidated
  };
}

/**
 * Generates a description explaining how the consensus was reached
 */
function determineConsensusDescription(
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
