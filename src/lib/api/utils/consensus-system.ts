/**
 * Weighted Multi-Source Consensus System
 * 
 * This module implements a consensus-based approach to determining interaction severity
 * by weighing multiple data sources according to their reliability.
 */

import { InteractionSource, AdverseEventData } from '../types';

// Revised source confidence weights to be more balanced
const SOURCE_WEIGHTS = {
  'RxNorm': 0.85, // 85% confidence (slightly reduced)
  'FDA': 0.80,    // 80% confidence (unchanged)
  'SUPP.AI': 0.65, // 65% confidence (slightly increased)
  'OpenFDA Adverse Events': 0.70, // 70% confidence (slightly reduced)
  'VitaCheck Safety Database': 0.90, // 90% confidence (slightly reduced)
  'No Data Available': 0.0, // 0% confidence
  'AI Literature Analysis': 0.55 // 55% confidence (slightly increased)
};

// Revised threshold for considering a severe adverse event rate significant
const SEVERE_EVENT_THRESHOLD = 0.03; // 3% of total events (reduced from 5%)

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

  console.log("Input sources for consensus calculation:", 
    sources.map(s => `${s.name}: ${s.severity} (confidence: ${s.confidence})`));

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
  let uniqueSources = new Set<string>();

  // Process each source
  sources.forEach(source => {
    // Skip duplicate sources to prevent biasing
    if (uniqueSources.has(source.name)) {
      console.log(`Skipping duplicate source: ${source.name}`);
      return;
    }
    uniqueSources.add(source.name);
    
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
    
    console.log(`Processing source: ${source.name}, severity: ${source.severity}, weight: ${weight}`);
  });

  // Factor in adverse events data if available
  if (adverseEvents && adverseEvents.eventCount > 0) {
    const adverseEventWeight = SOURCE_WEIGHTS['OpenFDA Adverse Events'];
    totalWeight += adverseEventWeight;
    
    // Calculate percentage of serious events
    const seriousPercentage = adverseEvents.seriousCount / adverseEvents.eventCount;
    console.log(`Adverse events: ${adverseEvents.eventCount} total, ${adverseEvents.seriousCount} serious (${seriousPercentage * 100}%)`);
    
    if (seriousPercentage >= SEVERE_EVENT_THRESHOLD) {
      // Significant serious events -> severe
      severityVotes.severe += adverseEventWeight;
      severityCounts.severe++;
      console.log(`Adverse events rated as SEVERE (${seriousPercentage * 100}% > ${SEVERE_EVENT_THRESHOLD * 100}%)`);
    } else if (adverseEvents.seriousCount > 0) {
      // Some serious events but below threshold -> moderate
      severityVotes.moderate += adverseEventWeight;
      severityCounts.moderate++;
      console.log(`Adverse events rated as MODERATE (serious events present but below threshold)`);
    } else if (adverseEvents.eventCount > 10) {
      // Many non-serious events -> minor
      severityVotes.minor += adverseEventWeight;
      severityCounts.minor++;
      console.log(`Adverse events rated as MINOR (many non-serious events)`);
    } else {
      // Few non-serious events -> considered safe
      severityVotes.safe += (adverseEventWeight * 0.5); // Half weight for this case
      severityCounts.safe++;
      console.log(`Adverse events rated as SAFE (few non-serious events)`);
    }
  }

  console.log("Severity votes after processing all sources:", severityVotes);
  console.log("Severity counts:", severityCounts);

  // Determine the final severity based on weighted votes
  let finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  let maxVote = 0;

  // Revised algorithm to be more balanced:
  // 1. If multiple high-confidence sources (not just one) agree on severe, use that
  // 2. Otherwise, go with highest weighted vote
  const highConfidenceSevere = sources.filter(
    s => s.severity === "severe" && (SOURCE_WEIGHTS[s.name] || 0) >= 0.8
  );
  
  if (highConfidenceSevere.length >= 2) {
    // At least two high-confidence sources agree on severe
    finalSeverity = "severe";
    console.log(`Multiple high-confidence sources (${highConfidenceSevere.map(s => s.name).join(', ')}) agree on SEVERE`);
  } else {
    // Otherwise determine by highest weighted vote
    (Object.keys(severityVotes) as Array<keyof typeof severityVotes>).forEach(severity => {
      if (severityVotes[severity] > maxVote) {
        maxVote = severityVotes[severity];
        finalSeverity = severity;
      }
    });
    console.log(`Highest weighted vote is for ${finalSeverity} with score ${maxVote}`);
  }

  // Calculate confidence score (0-100%)
  let confidenceScore = 0;
  if (totalWeight > 0) {
    // Base confidence on agreement between sources
    const primaryVote = severityVotes[finalSeverity!];
    confidenceScore = Math.min(100, Math.round((primaryVote / totalWeight) * 100));
    
    // Adjust confidence based on number of sources
    if (uniqueSources.size >= 3) {
      confidenceScore = Math.min(100, confidenceScore + 10);
      console.log("Confidence bonus: 3+ unique sources (+10%)");
    }
    
    // Adjust confidence based on source agreement
    const sourceCount = Object.values(severityCounts).filter(count => count > 0).length;
    const allAgree = sourceCount === 1;
    if (allAgree && uniqueSources.size > 1) {
      confidenceScore = Math.min(100, confidenceScore + 15);
      console.log("Confidence bonus: all sources agree (+15%)");
    }
    
    // AI validation can add confidence if it confirms other sources
    if (aiValidated && severityCounts[finalSeverity!] > 1) {
      confidenceScore = Math.min(100, confidenceScore + 10);
      console.log("Confidence bonus: AI validation confirms other sources (+10%)");
    }
  }

  console.log(`Final calculation: severity=${finalSeverity}, confidence=${confidenceScore}%, aiValidated=${aiValidated}`);

  // Generate a description that explains the consensus
  let description = determineConsensusDescription(finalSeverity!, confidenceScore, sources, adverseEvents);

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
  // Filter out duplicate sources by name and 'No Data Available' sources
  const uniqueSources = Array.from(
    new Map(sources.map(s => [s.name, s])).values()
  ).filter(s => s.name !== 'No Data Available');
  
  const sourceList = uniqueSources.map(s => s.name);
  
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
