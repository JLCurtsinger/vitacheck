
/**
 * API Result Processor
 * 
 * This file now serves as a lightweight facade to the refactored modules.
 * All implementation details have been moved to dedicated files.
 */

// Re-export all functionality from the refactored modules
export { 
  standardizeAndLogApiResults 
} from './api-response/standardizer';

export {
  enrichApiResults,
  extractSeverity,
  extractConfidence
} from './api-response/enricher';

export {
  validateAndLogSchemaDiscrepancies
} from './api-response/schema-validator';

// Correctly import ValidationResult type from the schema-validator directly
export type { ValidationResult } from './api-response/schema-validator';
