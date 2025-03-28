
import { StandardizedApiResponse } from '../../../types';
import { logApiResponseFormat, logStandardizedResponse } from '../../debug-logger';
import { validateAndLogSchemaDiscrepancies } from './schema-validator';
import { logFullApiResponse, hasValidInteractionData, logParsingIssue } from '../../diagnostics/api-response-logger';
import {
  rxNormExpectedSchema,
  suppAiExpectedSchema,
  fdaExpectedSchema,
  aiAnalysisExpectedSchema
} from '../../diagnostics/expected-schemas';

/**
 * Standardizes API results from all sources and logs them
 * Enhanced with comprehensive validation and debugging
 */
export function standardizeAndLogApiResults(
  rxnormRawResult: any | null,
  suppaiRawResult: any | null,
  fdaRawResult: any | null,
  aiAnalysisRawResult: any | null
): {
  rxnormResult: StandardizedApiResponse | null;
  suppaiResult: StandardizedApiResponse | null;
  fdaResult: StandardizedApiResponse | null;
  aiAnalysisResult: StandardizedApiResponse | null;
} {
  // Log full API response data for debugging
  if (rxnormRawResult) logFullApiResponse('RxNorm', rxnormRawResult, 'raw');
  if (suppaiRawResult) logFullApiResponse('SUPP.AI', suppaiRawResult, 'raw');
  if (fdaRawResult) logFullApiResponse('FDA', fdaRawResult, 'raw');
  if (aiAnalysisRawResult) logFullApiResponse('AI Literature', aiAnalysisRawResult, 'raw');
  
  // Validate schemas against expected format
  validateAndLogSchemaDiscrepancies(rxnormRawResult, 'RxNorm', rxNormExpectedSchema);
  validateAndLogSchemaDiscrepancies(suppaiRawResult, 'SUPP.AI', suppAiExpectedSchema);
  validateAndLogSchemaDiscrepancies(fdaRawResult, 'FDA', fdaExpectedSchema);
  validateAndLogSchemaDiscrepancies(aiAnalysisRawResult, 'AI Literature', aiAnalysisExpectedSchema);
  
  // Log API response formats before standardization
  logApiResponseFormat(rxnormRawResult, 'RxNorm');
  logApiResponseFormat(suppaiRawResult, 'SUPP.AI');
  logApiResponseFormat(fdaRawResult, 'FDA');
  logApiResponseFormat(aiAnalysisRawResult, 'AI Literature');
  
  // Check if responses contain valid interaction data
  logInteractionDataPresence(rxnormRawResult, 'RxNorm');
  logInteractionDataPresence(suppaiRawResult, 'SUPP.AI');
  logInteractionDataPresence(fdaRawResult, 'FDA');
  logInteractionDataPresence(aiAnalysisRawResult, 'AI Literature');
  
  // Standardize each API response to ensure consistent structure
  const rxnormResult = rxnormRawResult 
    ? standardizeApiResponse("RxNorm", rxnormRawResult, rxnormRawResult.description || "") 
    : null;
    
  const suppaiResult = suppaiRawResult 
    ? standardizeApiResponse("SUPP.AI", suppaiRawResult, suppaiRawResult.description || "")
    : null;
    
  const fdaResult = fdaRawResult 
    ? standardizeApiResponse("FDA", fdaRawResult, fdaRawResult.description || "")
    : null;
    
  const aiAnalysisResult = aiAnalysisRawResult 
    ? standardizeApiResponse("AI Literature Analysis", aiAnalysisRawResult, aiAnalysisRawResult.description || "")
    : null;
  
  // Log standardized responses
  logStandardizedResponse(rxnormResult, 'RxNorm');
  logStandardizedResponse(suppaiResult, 'SUPP.AI');
  logStandardizedResponse(fdaResult, 'FDA');
  logStandardizedResponse(aiAnalysisResult, 'AI Literature');

  return {
    rxnormResult,
    suppaiResult,
    fdaResult,
    aiAnalysisResult
  };
}

/**
 * Standardizes an API response into a consistent format
 */
function standardizeApiResponse(
  source: string,
  rawData: any,
  description: string = "No description available"
): StandardizedApiResponse {
  return {
    source,
    severity: null, // Will be assigned by scoring or ML
    description,
    confidence: null,
    rawData,
    processed: false
  };
}

/**
 * Checks and logs whether responses contain valid interaction data
 */
function logInteractionDataPresence(response: any, sourceName: string): void {
  if (!response) return;
  
  const hasData = hasValidInteractionData(response);
  
  if (hasData) {
    console.log(`[Data Validation] ${sourceName} contains valid interaction data`);
  } else {
    console.warn(`[Data Validation] ${sourceName} response lacks valid interaction data`);
    logParsingIssue(
      sourceName, 
      response, 
      'Response does not contain valid interaction data despite being non-null'
    );
  }
}
