
import { StandardizedApiResponse } from '../../../types';
import { logApiResponseFormat, logStandardizedResponse } from '../../debug-logger';
import { validateAndLogSchemaDiscrepancies } from './schema-validator';
import { logFullApiResponse, logParsingIssue } from '../../diagnostics/api-response-logger';
import {
  rxNormExpectedSchemas,
  suppAiExpectedSchemas,
  fdaExpectedSchemas,
  aiAnalysisExpectedSchemas
} from '../../diagnostics/expected-schemas';

/**
 * Standardizes API results from all sources and logs them
 * Enhanced with comprehensive validation and fallback handling
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
  
  // Validate schemas against expected formats with enhanced validation
  const rxnormValidation = validateAndLogSchemaDiscrepancies(rxnormRawResult, 'RxNorm', rxNormExpectedSchemas);
  const suppaiValidation = validateAndLogSchemaDiscrepancies(suppaiRawResult, 'SUPP.AI', suppAiExpectedSchemas);
  const fdaValidation = validateAndLogSchemaDiscrepancies(fdaRawResult, 'FDA', fdaExpectedSchemas);
  const aiValidation = validateAndLogSchemaDiscrepancies(aiAnalysisRawResult, 'AI Literature', aiAnalysisExpectedSchemas);
  
  // Log API response formats before standardization
  logApiResponseFormat(rxnormRawResult, 'RxNorm');
  logApiResponseFormat(suppaiRawResult, 'SUPP.AI');
  logApiResponseFormat(fdaRawResult, 'FDA');
  logApiResponseFormat(aiAnalysisRawResult, 'AI Literature');
  
  // Standardize each API response with fallback handling
  const rxnormResult = rxnormRawResult 
    ? standardizeApiResponse(
        "RxNorm", 
        rxnormRawResult, 
        extractDescription(rxnormRawResult),
        rxnormValidation.fallbackUsed,
        rxnormValidation.fallbackReason
      ) 
    : null;
    
  const suppaiResult = suppaiRawResult 
    ? standardizeApiResponse(
        "SUPP.AI", 
        suppaiRawResult, 
        extractDescription(suppaiRawResult),
        suppaiValidation.fallbackUsed,
        suppaiValidation.fallbackReason
      )
    : null;
    
  const fdaResult = fdaRawResult 
    ? standardizeApiResponse(
        "FDA", 
        fdaRawResult, 
        extractDescription(fdaRawResult),
        fdaValidation.fallbackUsed,
        fdaValidation.fallbackReason
      )
    : null;
    
  const aiAnalysisResult = aiAnalysisRawResult 
    ? standardizeApiResponse(
        "AI Literature Analysis", 
        aiAnalysisRawResult, 
        extractDescription(aiAnalysisRawResult),
        aiValidation.fallbackUsed,
        aiValidation.fallbackReason
      )
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
 * Standardizes an API response into a consistent format with fallback support
 */
function standardizeApiResponse(
  source: string,
  rawData: any,
  description: string = "No description available",
  fallbackMode: boolean = false,
  fallbackReason: string = ""
): StandardizedApiResponse {
  return {
    source,
    severity: null, // Will be assigned by scoring or ML
    description,
    confidence: null,
    rawData,
    processed: false,
    fallbackMode,
    fallbackReason: fallbackMode ? fallbackReason : undefined
  };
}

/**
 * Intelligently extracts description from various API response formats
 */
function extractDescription(data: any): string {
  if (!data) return "No description available";
  
  // Direct description field
  if (data.description && typeof data.description === 'string') {
    return data.description;
  }
  
  // Check sources array
  if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
    const firstSource = data.sources[0];
    if (firstSource && firstSource.description) {
      return firstSource.description;
    }
  }
  
  // Check interactions array (for SUPP.AI format)
  if (data.interactions && Array.isArray(data.interactions) && data.interactions.length > 0) {
    const firstInteraction = data.interactions[0];
    if (firstInteraction && firstInteraction.label) {
      return firstInteraction.label;
    }
    if (firstInteraction && firstInteraction.evidence) {
      return firstInteraction.evidence;
    }
  }
  
  // Check RxNorm specific format
  if (data.fullInteractionTypeGroup && 
      Array.isArray(data.fullInteractionTypeGroup) && 
      data.fullInteractionTypeGroup.length > 0) {
    
    const interactionType = data.fullInteractionTypeGroup[0].fullInteractionType;
    if (interactionType && 
        Array.isArray(interactionType) && 
        interactionType.length > 0 &&
        interactionType[0].interactionPair &&
        Array.isArray(interactionType[0].interactionPair) &&
        interactionType[0].interactionPair.length > 0) {
      
      return interactionType[0].interactionPair[0].description || "No description available";
    }
  }
  
  // FDA specific format
  if (data.results && 
      Array.isArray(data.results) && 
      data.results.length > 0) {
    
    const result = data.results[0];
    if (result.drug_interactions) {
      return result.drug_interactions;
    }
    if (result.boxed_warnings) {
      return result.boxed_warnings;
    }
    if (result.warnings) {
      return Array.isArray(result.warnings) 
        ? result.warnings.join(' ') 
        : result.warnings;
    }
  }
  
  return "No description available";
}
