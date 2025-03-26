
import { StandardizedApiResponse } from '../../types';
import { logApiResponseFormat, logStandardizedResponse } from '../debug-logger';
import { standardizeApiResponse } from '../api-response-standardizer';

/**
 * Standardizes API results from all sources and logs them
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
  // Log API response formats before standardization
  logApiResponseFormat(rxnormRawResult, 'RxNorm');
  logApiResponseFormat(suppaiRawResult, 'SUPP.AI');
  logApiResponseFormat(fdaRawResult, 'FDA');
  logApiResponseFormat(aiAnalysisRawResult, 'AI Literature');
  
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
 * Enriches standardized results with raw data information
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
  // Set severity and confidence from raw data for backward compatibility
  if (rxnormResult && rxnormRawResult) {
    rxnormResult.severity = rxnormRawResult.severity || "unknown";
    rxnormResult.confidence = rxnormRawResult.sources?.[0]?.confidence || null;
  }
  
  if (suppaiResult && suppaiRawResult) {
    suppaiResult.severity = suppaiRawResult.severity || "unknown";
    suppaiResult.confidence = suppaiRawResult.sources?.[0]?.confidence || null;
  }
  
  if (fdaResult && fdaRawResult) {
    fdaResult.severity = fdaRawResult.severity || "unknown";
    fdaResult.confidence = fdaRawResult.sources?.[0]?.confidence || null;
  }
  
  if (aiAnalysisResult && aiAnalysisRawResult) {
    aiAnalysisResult.severity = aiAnalysisRawResult.severity || "unknown";
    aiAnalysisResult.confidence = aiAnalysisRawResult.confidence || null;
  }
}
