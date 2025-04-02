
/**
 * API Validation Utilities
 * 
 * Provides utilities for validating API responses and ensuring 
 * they contain required data elements to be considered valid and reliable.
 */

import { InteractionSource } from '../../types';

/**
 * Validates a source by checking for required fields and ensuring
 * they conform to expected formats
 */
export function validateSource(source: InteractionSource): {
  isValid: boolean;
  reason?: string;
  missingFields: string[];
} {
  const missingFields: string[] = [];
  
  // Check for required fields
  if (!source.name) missingFields.push('name');
  if (!source.severity) missingFields.push('severity');
  if (!source.description) missingFields.push('description');
  
  // Check if all required fields are present
  if (missingFields.length > 0) {
    return {
      isValid: false,
      reason: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }
  
  // Validate severity value
  const validSeverities = ['safe', 'minor', 'moderate', 'severe', 'unknown'];
  if (!validSeverities.includes(source.severity)) {
    return {
      isValid: false,
      reason: `Invalid severity value: ${source.severity}`,
      missingFields: []
    };
  }
  
  // Description should have meaningful content
  if (source.description.length < 10) {
    return {
      isValid: false,
      reason: 'Description is too short',
      missingFields: []
    };
  }
  
  // Success case
  return {
    isValid: true,
    missingFields: []
  };
}

/**
 * Checks if a source contains meaningful interaction information
 */
export function hasInteractionEvidence(source: InteractionSource): boolean {
  // First make sure it's a valid source
  const { isValid } = validateSource(source);
  if (!isValid) return false;
  
  // Unknown severity with no confidence score is not evidence
  if (source.severity === 'unknown' && !source.confidence) {
    return false;
  }
  
  // Check for error markers in description
  const errorPatterns = [
    /error occurred/i,
    /unable to process/i,
    /no data/i,
    /unavailable/i,
    /could not find/i
  ];
  
  if (source.description && errorPatterns.some(pattern => pattern.test(source.description))) {
    return false;
  }
  
  // Check for evidential statements
  const evidencePatterns = [
    /interact/i,
    /effect/i,
    /warning/i,
    /risk/i,
    /reaction/i,
    /level/i,
    /mechanism/i,
    /cause/i
  ];
  
  if (source.description && evidencePatterns.some(pattern => pattern.test(source.description))) {
    return true;
  }
  
  // If source has specific severity and OK confidence, consider it evidence
  if (source.severity !== 'unknown' && source.confidence && source.confidence > 40) {
    return true;
  }
  
  // If it has some confidence but not other markers, check its reliability flag
  if (source.isReliable === true) {
    return true;
  }
  
  // Default case - not enough evidence
  return false;
}
