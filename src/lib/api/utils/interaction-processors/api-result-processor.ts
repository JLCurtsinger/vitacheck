
/**
 * API Result Processor
 * 
 * This file now serves as a lightweight facade to the refactored modules.
 * All implementation details have been moved to dedicated files.
 */

// Re-export all functionality from the refactored modules
import { standardizeApiResponse, validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';

// Create a standardizeAndLogApiResults function here
export function standardizeAndLogApiResults(
  rxnormRawResult: any,
  suppaiRawResult: any,
  fdaRawResult: any,
  aiAnalysisRawResult: any
) {
  console.log('[API Result Processor] Standardizing API results');
  
  const rxnormResult = rxnormRawResult ? validateStandardizedResponse(standardizeApiResponse('RxNorm', rxnormRawResult)) : null;
  const suppaiResult = suppaiRawResult ? validateStandardizedResponse(standardizeApiResponse('SUPP.AI', suppaiRawResult)) : null;
  const fdaResult = fdaRawResult ? validateStandardizedResponse(standardizeApiResponse('FDA', fdaRawResult)) : null;
  const aiAnalysisResult = aiAnalysisRawResult ? validateStandardizedResponse(standardizeApiResponse('AI Literature Analysis', aiAnalysisRawResult)) : null;
  
  return {
    rxnormResult,
    suppaiResult,
    fdaResult,
    aiAnalysisResult
  };
}

export {
  enrichApiResults,
  extractSeverity,
  extractConfidence
} from './api-response/enricher';

export {
  validateAndLogSchemaDiscrepancies
} from './api-response/schema-validator';

// Correctly import ValidationResult type from the schema-validator
export type { ValidationResult } from './api-response/schema-validator';
