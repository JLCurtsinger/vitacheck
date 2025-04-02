
/**
 * RxNorm Response Parser
 * 
 * Handles parsing of RxNorm API responses into standardized interaction data
 */

import { InteractionSource } from '../../../types';
import { logParsingIssue } from '../../diagnostics/api-response-logger';

/**
 * Extracts interaction data from RxNorm's native format
 * Used when the response is in an unexpected format
 */
export function extractInteractionDataFromNativeFormat(rxnormRawResult: any): InteractionSource[] {
  const sources: InteractionSource[] = [];
  
  if (!rxnormRawResult.fullInteractionTypeGroup || 
      !rxnormRawResult.fullInteractionTypeGroup.length) {
    return sources;
  }
  
  console.log('[RxNorm] Extracting interaction data from native format');
  
  // Extract interaction data from RxNorm's native format
  const interactions = rxnormRawResult.fullInteractionTypeGroup[0]?.fullInteractionType || [];
  console.log(`[RxNorm] Found ${interactions.length} interactions in fullInteractionType`);
  
  for (const interaction of interactions) {
    if (interaction.interactionPair && interaction.interactionPair.length > 0) {
      const pair = interaction.interactionPair[0];
      if (pair.description) {
        // Create a synthetic source from direct API data
        const syntheticSource: InteractionSource = {
          name: "RxNorm",
          severity: pair.severity || "unknown",
          description: pair.description,
          confidence: 90 // High confidence for direct RxNorm data
        };
        
        sources.push(syntheticSource);
      }
    }
  }
  
  console.log(`[RxNorm] Extracted ${sources.length} sources from native format`);
  return sources;
}

/**
 * Processes standard RxNorm sources from a well-formatted response
 */
export function processStandardSources(
  rxnormRawResult: any
): InteractionSource[] {
  const sources: InteractionSource[] = [];
  
  if (!rxnormRawResult.sources || !Array.isArray(rxnormRawResult.sources)) {
    return sources;
  }
  
  console.log(`[RxNorm] Processing ${rxnormRawResult.sources.length} sources from standard response`);
  let validSourcesCount = 0;
  
  rxnormRawResult.sources.forEach((source: any, index: number) => {
    // Only add relevant sources with interaction data
    const isRelevant = source.description && 
                      !source.description.toLowerCase().includes('no interaction');
    
    if (isRelevant) {
      sources.push({
        name: "RxNorm",
        severity: source.severity || "unknown",
        description: source.description,
        confidence: source.confidence || 90 // High confidence for RxNorm
      });
      validSourcesCount++;
    }
  });
  
  console.log(`[RxNorm] Processed ${validSourcesCount} valid sources from standard format`);
  return sources;
}
