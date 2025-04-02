
/**
 * Fallback Result Generator
 * 
 * This module creates standardized fallback results when API data is unavailable.
 */

import { InteractionResult } from '../../types';
import { createDefaultSource } from '../severity-processor';

/**
 * Creates a fallback interaction result when API data is unavailable
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @param customDescription - Optional custom description
 * @returns A valid fallback InteractionResult
 */
export function createFallbackInteractionResult(
  med1: string, 
  med2: string,
  customDescription?: string
): InteractionResult {
  const description = customDescription || 
    `No interaction data available for the combination of ${med1} and ${med2}.`;
  
  return {
    medications: [med1, med2],
    severity: "unknown",
    description,
    sources: [createDefaultSource()],
    confidenceScore: 0,
    aiValidated: false
  };
}
