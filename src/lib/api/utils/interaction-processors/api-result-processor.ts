import { StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues, logApiResponseFormat, logStandardizedResponse } from '../debug-logger';
import { standardizeApiResponse } from '../api-response-standardizer';
import { 
  logFullApiResponse, 
  validateApiSchema, 
  hasValidInteractionData, 
  logParsingIssue 
} from '../diagnostics/api-response-logger';
import {
  rxNormExpectedSchema,
  suppAiExpectedSchema,
  fdaExpectedSchema,
  adverseEventsExpectedSchema,
  aiAnalysisExpectedSchema
} from '../diagnostics/expected-schemas';

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
 * Validates API responses against expected schemas and logs discrepancies
 */
function validateAndLogSchemaDiscrepancies(response: any, sourceName: string, expectedSchema: any): void {
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

/**
 * Enriches standardized results with raw data information
 * Enhanced with validation and fallback logic
 */
export function enrichApiResults(
  rxnormResult: StandardizedApiResponse | null,
  suppaiResult: StandardizedApiResponse | null, 
  fdaResult: StandardizedApiResponse | null,
  aiAnalysisResult: StandardizedApiResponse | null,
  rxnormRawResult: any | null,
  suppaiRawResult: any | null,
  fdaRawResult: any | null,
  aiAnalysisRawResult: any | null
): void {
  try {
    // Set severity and confidence from raw data for backward compatibility
    if (rxnormResult && rxnormRawResult) {
      rxnormResult.severity = extractSeverity(rxnormRawResult) || "unknown";
      rxnormResult.confidence = extractConfidence(rxnormRawResult, 'RxNorm');
    }
    
    if (suppaiResult && suppaiRawResult) {
      suppaiResult.severity = extractSeverity(suppaiRawResult) || "unknown";
      suppaiResult.confidence = extractConfidence(suppaiRawResult, 'SUPP.AI');
    }
    
    if (fdaResult && fdaRawResult) {
      fdaResult.severity = extractSeverity(fdaRawResult) || "unknown";
      fdaResult.confidence = extractConfidence(fdaRawResult, 'FDA');
    }
    
    if (aiAnalysisResult && aiAnalysisRawResult) {
      aiAnalysisResult.severity = extractSeverity(aiAnalysisRawResult) || "unknown";
      aiAnalysisResult.confidence = aiAnalysisRawResult.confidence || extractConfidence(aiAnalysisRawResult, 'AI');
    }
    
    // Log successful enrichment completion
    console.log('[API Processing] Successfully enriched API results with additional data');
  } catch (error) {
    console.error('[API Processing] Error enriching API results:', error);
    logParsingIssue('API Enrichment', 
      { rxnormResult, suppaiResult, fdaResult, aiAnalysisResult }, 
      error instanceof Error ? error : String(error)
    );
  }
}

/**
 * Helper to extract severity from raw result with fallback logic
 */
function extractSeverity(rawResult: any): "safe" | "minor" | "moderate" | "severe" | "unknown" | null {
  // Direct severity field
  if (rawResult.severity) {
    return rawResult.severity;
  }
  
  // Check first source if available
  if (rawResult.sources?.[0]?.severity) {
    return rawResult.sources[0].severity;
  }
  
  // Check in interaction pairs (RxNorm format)
  if (rawResult.fullInteractionTypeGroup?.[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.severity) {
    const severity = rawResult.fullInteractionTypeGroup[0].fullInteractionType[0].interactionPair[0].severity;
    
    // Map RxNorm severities to our format
    if (severity === 'N/A') return 'unknown';
    if (severity === 'high') return 'severe';
    if (severity === 'medium') return 'moderate';
    if (severity === 'low') return 'minor';
  }
  
  // No valid severity found
  return null;
}

/**
 * Helper to extract confidence from raw result with fallback logic
 */
function extractConfidence(rawResult: any, source: string): number {
  // Direct confidence field
  if (typeof rawResult.confidence === 'number') {
    return rawResult.confidence;
  }
  
  // Check first source if available
  if (typeof rawResult.sources?.[0]?.confidence === 'number') {
    return rawResult.sources[0].confidence;
  }
  
  // Use source-specific default confidence values
  switch (source) {
    case 'RxNorm': return 90; // High confidence for RxNorm
    case 'SUPP.AI': return 80; // Medium-high for SUPP.AI
    case 'FDA': return 95;    // Very high for FDA
    case 'AI': return 70;     // Medium for AI analysis
    default: return 50;       // Default middle value
  }
}
