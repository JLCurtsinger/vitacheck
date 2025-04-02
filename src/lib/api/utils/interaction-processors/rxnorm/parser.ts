
/**
 * RxNorm Parser
 * 
 * Handles parsing of RxNorm API responses into standardized interaction sources
 */

import { InteractionSource, StandardizedApiResponse } from '../../../types';
import { logParsingIssue } from '../../diagnostics/api-response-logger';
import { recoverInvalidSource } from './recovery';

/**
 * Parses RxNorm interaction data from a standardized response
 */
export function parseRxNormInteractionData(
  standardizedResponse: StandardizedApiResponse,
  rawResponse: any
): InteractionSource[] | null {
  try {
    console.log('[RxNorm Parser] Parsing interaction data');
    
    // No interaction data in raw response
    if (!rawResponse || 
        !rawResponse.fullInteractionTypeGroup || 
        rawResponse.fullInteractionTypeGroup.length === 0) {
      console.log('[RxNorm Parser] No interaction data found in response');
      return null;
    }

    const sources: InteractionSource[] = [];
    
    // Process each interaction type group
    rawResponse.fullInteractionTypeGroup.forEach((group: any, groupIndex: number) => {
      if (!group.fullInteractionType || !Array.isArray(group.fullInteractionType)) {
        console.log(`[RxNorm Parser] Group ${groupIndex} has no fullInteractionType array`);
        return;
      }
      
      // Process each interaction type within the group
      group.fullInteractionType.forEach((interactionType: any, typeIndex: number) => {
        if (!interactionType.interactionPair || !Array.isArray(interactionType.interactionPair)) {
          console.log(`[RxNorm Parser] Interaction type ${typeIndex} in group ${groupIndex} has no interactionPair array`);
          return;
        }
        
        // Process each interaction pair
        interactionType.interactionPair.forEach((pair: any, pairIndex: number) => {
          try {
            if (!pair.description) {
              console.log(`[RxNorm Parser] Missing description in interaction pair ${pairIndex}`);
              return;
            }
            
            // Create standardized source from the interaction pair
            const source: InteractionSource = {
              name: "RxNorm",
              severity: pair.severity || "unknown",
              description: pair.description,
              confidence: 80, // RxNorm is a trusted source
              rawData: {
                ...pair,
                groupIndex,
                typeIndex,
                pairIndex
              }
            };
            
            sources.push(source);
            console.log(`[RxNorm Parser] Added source from pair ${pairIndex} with severity ${source.severity}`);
          } catch (pairError) {
            console.error(`[RxNorm Parser] Error processing interaction pair ${pairIndex}:`, pairError);
          }
        });
      });
    });
    
    if (sources.length === 0) {
      console.log('[RxNorm Parser] No valid sources extracted from RxNorm data');
    } else {
      console.log(`[RxNorm Parser] Successfully extracted ${sources.length} sources`);
    }
    
    return sources;
    
  } catch (error) {
    // Log the error and response for debugging
    logParsingIssue('RxNorm', rawResponse, error);
    console.error('[RxNorm Parser] Failed to parse RxNorm data:', error);
    return null;
  }
}
