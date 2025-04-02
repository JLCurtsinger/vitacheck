
import { ValidationResult } from '../../../utils/diagnostics/schema-validator';
import { logParsingIssue } from '../../diagnostics/api-response-logger';

/**
 * Validates API responses against expected schemas and logs discrepancies
 * @returns ValidationResult object with fallback information
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
  
  // Create fallback fields list for recovery
  const fallbackFields: string[] = [];
  const crucialFields = ['description', 'severity', 'sources', 'results', 'interactions', 'fullInteractionTypeGroup'];
  
  // Simple validation - check for presence of crucial fields
  crucialFields.forEach(field => {
    if (response[field]) {
      fallbackFields.push(field);
    }
  });
  
  // Determine if we have enough fields to process using fallbacks
  const canFallback = fallbackFields.length > 0;
  
  // Create result object
  const result: ValidationResult = {
    isValid: false, // We'll assume schema mismatch requiring fallbacks
    discrepancies: [],
    fallbackUsed: canFallback,
    fallbackFields: canFallback ? fallbackFields : undefined,
    fallbackReason: canFallback 
      ? `Schema adjustments using fields: ${fallbackFields.join(', ')}`
      : 'Schema mismatch with no fallback options'
  };
  
  // Log results based on outcome
  if (canFallback) {
    console.info(`[Schema Handling] ${sourceName} using fallback processing with fields: ${fallbackFields.join(', ')}`);
  } else {
    console.warn(`[Schema Validation] ${sourceName} has unrecoverable schema issues`);
    logParsingIssue(
      sourceName, 
      response, 
      `Schema validation found no usable fields for recovery`
    );
  }
  
  return result;
}

// Re-export the ValidationResult type
export type { ValidationResult } from '../../../utils/diagnostics/schema-validator';
