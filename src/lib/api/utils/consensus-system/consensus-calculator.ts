
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
  console.log(`[Consensus Calculator] Starting consensus calculation with ${sources.length} sources`, 
    sources.map(s => ({ name: s.name, severity: s.severity, confidence: s.confidence })));
  
  if (!sources.length) {
    console.log('[Consensus Calculator] No sources provided, returning unknown severity');
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
  
  console.log(`[Consensus Calculator] Processed source weights:`, 
    sourceWeights.map(item => ({ name: item.source.name, severity: item.source.severity, weight: item.weight })));
  console.log(`[Consensus Calculator] Total weight: ${totalWeight}, AI validated: ${aiValidated}`);
  
  // If no sources have weight, return unknown
  if (totalWeight === 0) {
    console.log('[Consensus Calculator] Total weight is zero, returning unknown severity');
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
    
    console.log(`[Consensus Calculator] Added vote for "${severity}" with weight ${weight} from source "${source.name}"`);
  });

  console.log(`[Consensus Calculator] Initial severity votes:`, severityVotes);
  console.log(`[Consensus Calculator] Initial severity counts:`, severityCounts);

  // Factor in adverse events data if available
  const adverseEventData = processAdverseEvents(adverseEvents);
  if (adverseEventData) {
    const { weight, severity, count } = adverseEventData;
    severityVotes[severity] += weight;
    severityCounts[severity] += count;
    
    console.log(`[Consensus Calculator] Added adverse event vote for "${severity}" with weight ${weight}`);
    console.log(`[Consensus Calculator] Updated severity votes after adverse events:`, severityVotes);
  }

  // Determine the final severity based on weighted votes
  const finalSeverity = determineFinalSeverity(severityVotes, sourceWeights);
  console.log(`[Consensus Calculator] Final determined severity: "${finalSeverity}"`);

  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(
    finalSeverity,
    severityVotes,
    totalWeight,
    sourceWeights,
    severityCounts,
    aiValidated
  );
  
  console.log(`[Consensus Calculator] Calculated confidence score: ${confidenceScore}%`);
  
  // Generate a description that explains the consensus
  const sourcesToProcess = sources.filter(source => source && source.name);
  const description = determineConsensusDescription(
    finalSeverity, 
    confidenceScore, 
    sourcesToProcess, 
    adverseEvents
  );
  
  console.log(`[Consensus Calculator] Generated consensus description: ${description.substring(0, 100)}...`);

  const result = {
    severity: finalSeverity,
    confidenceScore,
    description,
    aiValidated
  };

  // Generate a diagnostic summary
  console.log('[DIAGNOSTIC SUMMARY] Consensus calculation results:', {
    rxNormSources: sources.filter(s => s.name === 'RxNorm').length,
    suppAiSources: sources.filter(s => s.name === 'SUPP.AI').length,
    fdaSources: sources.filter(s => s.name === 'FDA').length,
    aiSources: sources.filter(s => s.name === 'AI Literature Analysis').length,
    adverseEventSources: sources.filter(s => s.name === 'OpenFDA Adverse Events').length,
    severityVotes,
    severityCounts,
    finalSeverity,
    confidenceScore,
    totalWeight,
    aiValidated
  });

  return result;
}
