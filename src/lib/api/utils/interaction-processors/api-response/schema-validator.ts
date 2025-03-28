
import { validateApiSchema, logParsingIssue } from '../../diagnostics/api-response-logger';

/**
 * Validates API responses against expected schemas and logs discrepancies
 */
export function validateAndLogSchemaDiscrepancies(response: any, sourceName: string, expectedSchema: any): void {
  if (!response) return;
  
  const discrepancies = validateApiSchema(expectedSchema, response);
  
  if (discrepancies.length > 0) {
    console.warn(`[Schema Validation] ${sourceName} response has schema discrepancies:`, discrepancies);
    logParsingIssue(
      sourceName, 
      response, 
      `Schema validation found ${discrepancies.length} discrepancies: ${discrepancies.slice(0, 3).join(', ')}${discrepancies.length > 3 ? '...' : ''}`
    );
  } else {
    console.log(`[Schema Validation] ${sourceName} response matches expected schema`);
  }
}
