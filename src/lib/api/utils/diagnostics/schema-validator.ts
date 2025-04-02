
/**
 * Enhanced Schema Validator
 * 
 * This module provides an enhanced schema validation system that supports multiple
 * API response shapes and recoverable schema mismatches.
 */

import { logParsingIssue } from './api-response-logger';

// Validation result type definition
export interface ValidationResult {
  isValid: boolean;
  discrepancies: string[];
  fallbackUsed: boolean;
  fallbackReason?: string;
  fallbackFields?: string[];
}

/**
 * Validates API responses against multiple possible schemas
 * Returns detailed information about validation success or fallback usage
 */
export function validateApiSchema(
  expectedSchemas: Record<string, any>[],
  actual: Record<string, any>,
  path: string = ''
): ValidationResult {
  // Try each schema until we find one that matches
  for (let i = 0; i < expectedSchemas.length; i++) {
    const discrepancies = compareSchema(expectedSchemas[i], actual, path);
    
    // If we found a perfect match, return success
    if (discrepancies.length === 0) {
      return {
        isValid: true,
        discrepancies: [],
        fallbackUsed: false
      };
    }
  }

  // No exact schema match, attempt to identify crucial fields for fallback
  const fallbackFields: string[] = [];
  const cruicalFields = ['description', 'severity', 'sources', 'results', 'interactions'];
  
  // Check which crucial fields are available for fallback processing
  cruicalFields.forEach(field => {
    if (actual[field]) {
      fallbackFields.push(field);
    }
  });
  
  // If we have enough fields for fallback processing, mark as recoverable
  const canFallback = fallbackFields.length > 0;
  
  return {
    isValid: false,
    discrepancies: [], // We don't need to return all discrepancies for fallbacks
    fallbackUsed: canFallback,
    fallbackReason: canFallback 
      ? `Schema mismatch with recoverable fields: ${fallbackFields.join(', ')}`
      : 'Schema mismatch with no recoverable fields',
    fallbackFields: canFallback ? fallbackFields : undefined
  };
}

/**
 * Compare expected schema with actual response
 * Returns a list of discrepancies found
 */
function compareSchema(
  expected: Record<string, any>,
  actual: Record<string, any>,
  path: string = ''
): string[] {
  const discrepancies: string[] = [];
  
  // Check for missing expected fields in actual
  for (const key of Object.keys(expected)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!(key in actual)) {
      discrepancies.push(`Missing expected field: ${currentPath}`);
      continue;
    }
    
    // If both are objects, recurse
    if (
      typeof expected[key] === 'object' && 
      expected[key] !== null && 
      typeof actual[key] === 'object' && 
      actual[key] !== null
    ) {
      discrepancies.push(...compareSchema(expected[key], actual[key], currentPath));
    }
    
    // Check for type mismatches
    else if (typeof expected[key] !== typeof actual[key]) {
      discrepancies.push(
        `Type mismatch for ${currentPath}: expected ${typeof expected[key]}, got ${typeof actual[key]}`
      );
    }
  }
  
  return discrepancies;
}

/**
 * Validates and logs API response schema with improved fallback handling
 */
export function validateAndLogSchemaDiscrepancies(
  response: any, 
  sourceName: string, 
  expectedSchemas: Record<string, any>[]
): ValidationResult {
  if (!response) return { 
    isValid: false, 
    discrepancies: ['Response is null or undefined'],
    fallbackUsed: false
  };
  
  // Validate against all provided schemas
  const result = validateApiSchema(expectedSchemas, response);
  
  // Log validation results based on outcome
  if (result.isValid) {
    console.log(`[Schema Validation] ${sourceName} response matches expected schema`);
  } 
  else if (result.fallbackUsed) {
    // For recoverable schema mismatches, log as info, not error
    console.info(
      `[Schema Validation] ${sourceName} using fallback schema handling: ${result.fallbackReason}`,
      `Available fields for fallback: ${result.fallbackFields?.join(', ')}`
    );
  } 
  else {
    // Only log as warning for true schema errors with no fallback
    console.warn(`[Schema Validation] ${sourceName} response has unrecoverable schema issues`);
    logParsingIssue(
      sourceName, 
      response, 
      `Schema validation failed with no fallback options available`
    );
  }
  
  return result;
}
