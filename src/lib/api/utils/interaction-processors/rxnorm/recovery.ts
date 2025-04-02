
/**
 * RxNorm Recovery Mechanisms
 * 
 * Handles recovery strategies when RxNorm responses have issues
 */

import { InteractionSource } from '../../../types';
import { logParsingIssue } from '../../diagnostics/api-response-logger';
import { applySourceValidationFallback } from '../../consensus-system/source-validation';
import { standardizedResponseToSource } from '../../api-response-standardizer';

/**
 * Attempts to recover a source that failed standard validation
 */
export function recoverInvalidSource(
  source: any, 
  rxnormRawResult: any
): InteractionSource | null {
  try {
    console.log(`[RxNorm] Attempting fallback validation for invalid source`);
    
    // Try fallback logic if the source doesn't pass validation
    const fallbackSource = applySourceValidationFallback(source, rxnormRawResult);
    
    if (fallbackSource) {
      console.log('[RxNorm] Successfully applied fallback validation');
      return fallbackSource;
    }
    
    console.log('[RxNorm] Fallback validation failed');
    return null;
  } catch (error) {
    console.error('[RxNorm] Error in recovery attempt:', error);
    return null;
  }
}

/**
 * Creates a standardized error source when processing fails
 */
export function createErrorSource(error: any): InteractionSource {
  return {
    name: "RxNorm",
    severity: "unknown",
    description: "Unable to process RxNorm interaction data",
    confidence: 10,
    isReliable: false,
    fallbackMode: true,
    fallbackReason: error instanceof Error ? error.message : String(error)
  };
}
