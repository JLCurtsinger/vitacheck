
/**
 * RxNorm Response Validator
 * 
 * Handles validation of RxNorm API responses
 */

import { StandardizedApiResponse } from '../../../types';
import { logFullApiResponse } from '../../diagnostics/api-response-logger';
import { validateStandardizedResponse } from '../../api-response-standardizer';

/**
 * Validates a standardized RxNorm response
 */
export function validateRxNormResponse(
  standardizedResponse: Partial<StandardizedApiResponse>
): StandardizedApiResponse | null {
  if (!standardizedResponse) {
    return null;
  }
  
  try {
    // Create a standardized response with defaults for missing fields
    const validatedResponse = validateStandardizedResponse({
      ...standardizedResponse,
      source: "RxNorm"
    });
    
    console.log(`[RxNorm] Validated response: severity="${validatedResponse.severity}", confidence=${validatedResponse.confidence}`);
    return validatedResponse;
  } catch (error) {
    console.error(`[RxNorm] Validation error:`, error);
    return null;
  }
}

/**
 * Checks if RxNorm response has valid structure
 */
export function hasValidStructure(rxnormRawResult: any): boolean {
  if (!rxnormRawResult) {
    return false;
  }
  
  // Check for standard format
  const hasStandardFormat = rxnormRawResult.sources && 
                           Array.isArray(rxnormRawResult.sources);
  
  // Check for native format
  const hasNativeFormat = rxnormRawResult.fullInteractionTypeGroup && 
                         Array.isArray(rxnormRawResult.fullInteractionTypeGroup) && 
                         rxnormRawResult.fullInteractionTypeGroup.length > 0;
  
  return hasStandardFormat || hasNativeFormat;
}
