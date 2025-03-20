
/**
 * Severity Determination Utilities
 * 
 * This module handles severity determination and result processing for medication interactions.
 */

import { InteractionResult, InteractionSource, AdverseEventData } from '../types';
import { calculateConsensusScore } from './consensus-system';

export type Severity = "safe" | "minor" | "moderate" | "severe" | "unknown";

/**
 * Determines the final severity and description based on all API responses
 * using the Weighted Multi-Source Consensus System
 */
export function determineFinalSeverity(
  rxnormResult: any,
  suppaiResult: any,
  fdaResult: any,
  adverseEventsResult: AdverseEventData | null,
  sources: InteractionSource[]
): {
  severity: Severity,
  description: string,
  confidenceScore: number,
  aiValidated: boolean
} {
  // Enhanced logging to help debug confidence score calculation
  console.log('Determining final severity based on:', {
    rxnorm: rxnormResult ? `Found: ${rxnormResult.severity}` : 'No data',
    suppai: suppaiResult ? `Found: ${suppaiResult.severity}` : 'No data',
    fda: fdaResult ? `Found: ${fdaResult.severity}` : 'No data',
    adverseEvents: adverseEventsResult ? `Found ${adverseEventsResult.eventCount} events` : 'No data',
    sourceCount: sources.length,
    medicationPair: sources.length > 0 && sources[0].medications ? sources[0].medications.join('+') : 'unknown'
  });
  
  // Use the consensus system to calculate severity and confidence score
  const consensusResult = calculateConsensusScore(sources, adverseEventsResult);
  
  // Log consensus calculation result for debugging
  console.log('Consensus result for current query:', {
    severity: consensusResult.severity,
    confidenceScore: consensusResult.confidenceScore,
    aiValidated: consensusResult.aiValidated,
    description: consensusResult.description.substring(0, 50) + '...'
  });
  
  return {
    severity: consensusResult.severity,
    description: consensusResult.description,
    confidenceScore: consensusResult.confidenceScore,
    aiValidated: consensusResult.aiValidated
  };
}

/**
 * Creates a default source if no sources are available
 */
export function createDefaultSource(): InteractionSource {
  return {
    name: "No Data Available",
    severity: "unknown",
    description: "No interaction data available from any source",
    confidence: 0
  };
}
