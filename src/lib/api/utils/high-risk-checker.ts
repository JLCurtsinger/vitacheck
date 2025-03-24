
/**
 * High-Risk Combination Checker
 * 
 * This module provides functionality to quickly check if a medication pair
 * should be flagged as high-risk before proceeding with API calls.
 */

import { InteractionResult } from '../types';
import { checkHighRiskCombination } from './high-risk-interactions';
import { cacheInteractionResult } from './interaction-cache';

/**
 * Checks if a pair of medications is known to be high-risk and creates
 * an appropriate interaction result if so.
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @returns InteractionResult object if high-risk, null otherwise
 */
export function checkForHighRiskPair(
  med1: string,
  med2: string
): InteractionResult | null {
  // First check for known high-risk combinations
  const highRiskCheck = checkHighRiskCombination(med1, med2);
  
  if (highRiskCheck.isHighRisk) {
    const result = {
      medications: [med1, med2],
      severity: "severe" as const,
      description: highRiskCheck.description || "High risk combination detected",
      sources: [{
        name: "VitaCheck Safety Database",
        severity: "severe" as const,
        description: highRiskCheck.description,
        confidence: 95 // High confidence for known high-risk combinations
      }],
      confidenceScore: 95,
      aiValidated: false
    };
    
    // Cache the result
    cacheInteractionResult(med1, med2, result);
    return result;
  }
  
  return null;
}
