
/**
 * RxNorm Validator
 * 
 * Validates RxNorm API responses to ensure they contain the expected data structure
 */

import { logParsingIssue } from '../../diagnostics/api-response-logger';

/**
 * Validates a RxNorm response to ensure it has the expected structure
 */
export function validateRxNormResponse(response: any): boolean {
  if (!response) {
    console.log('[RxNorm Validator] Response is null or undefined');
    return false;
  }

  try {
    // Check for required structure
    // RxNorm responses should have a fullInteractionTypeGroup array
    if (!response.fullInteractionTypeGroup || !Array.isArray(response.fullInteractionTypeGroup)) {
      console.log('[RxNorm Validator] Missing or invalid fullInteractionTypeGroup array');
      return false;
    }
    
    // If the array is empty, that's a valid response with no interactions
    if (response.fullInteractionTypeGroup.length === 0) {
      console.log('[RxNorm Validator] Empty fullInteractionTypeGroup array (no interactions)');
      return true;
    }
    
    // Check for error indicators
    if (response.error) {
      console.log('[RxNorm Validator] Error field present in response:', response.error);
      return false;
    }
    
    // Check at least one group has interaction data
    const hasInteractions = response.fullInteractionTypeGroup.some((group: any) => 
      group.fullInteractionType && 
      Array.isArray(group.fullInteractionType) && 
      group.fullInteractionType.length > 0
    );
    
    if (!hasInteractions) {
      console.log('[RxNorm Validator] No interaction data found in any group');
      return false;
    }
    
    console.log('[RxNorm Validator] Response structure is valid');
    return true;
    
  } catch (error) {
    logParsingIssue('RxNorm Validator', response, error);
    console.error('[RxNorm Validator] Validation error:', error);
    return false;
  }
}
