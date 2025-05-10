
/**
 * API Response Enricher
 * 
 * Utility functions to enrich API responses with additional data.
 */

import { StandardizedApiResponse } from '../../../types';

/**
 * Extracts severity from an API response
 */
export function extractSeverity(response: any): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  if (!response) return "unknown";
  
  // Extract based on known severity field names
  if (response.severity) {
    return response.severity as "safe" | "minor" | "moderate" | "severe" | "unknown";
  }
  
  return "unknown";
}

/**
 * Extracts confidence score from an API response
 */
export function extractConfidence(response: any): number | undefined {
  if (!response) return undefined;
  
  if (typeof response.confidence === 'number') {
    return response.confidence;
  }
  
  return undefined;
}

/**
 * Enriches standardized API results with additional data from raw responses
 */
export function enrichApiResults(
  rxnormResult: StandardizedApiResponse | null,
  suppaiResult: StandardizedApiResponse | null,
  fdaResult: StandardizedApiResponse | null,
  aiAnalysisResult: StandardizedApiResponse | null,
  rxnormRawResult: any,
  suppaiRawResult: any,
  fdaRawResult: any,
  aiAnalysisRawResult: any
): void {
  console.log('[API Enricher] Enriching API results with raw data');
  
  // Do not proceed if results are null
  if (!rxnormResult && !suppaiResult && !fdaResult && !aiAnalysisResult) {
    return;
  }

  // Enrich RxNorm result
  if (rxnormResult && rxnormRawResult) {
    rxnormResult.rawData = rxnormRawResult;
    
    // Check if we have severity information in the raw data
    const severity = extractSeverity(rxnormRawResult);
    if (severity !== "unknown") {
      rxnormResult.severity = severity;
    }
    
    // Check for confidence info
    const confidence = extractConfidence(rxnormRawResult);
    if (confidence !== undefined) {
      rxnormResult.confidence = confidence;
    }
  }
  
  // Enrich SuppAI result
  if (suppaiResult && suppaiRawResult) {
    suppaiResult.rawData = suppaiRawResult;
    
    const severity = extractSeverity(suppaiRawResult);
    if (severity !== "unknown") {
      suppaiResult.severity = severity;
    }
    
    const confidence = extractConfidence(suppaiRawResult);
    if (confidence !== undefined) {
      suppaiResult.confidence = confidence;
    }
  }
  
  // Enrich FDA result
  if (fdaResult && fdaRawResult) {
    fdaResult.rawData = fdaRawResult;
    
    const severity = extractSeverity(fdaRawResult);
    if (severity !== "unknown") {
      fdaResult.severity = severity;
    }
    
    const confidence = extractConfidence(fdaRawResult);
    if (confidence !== undefined) {
      fdaResult.confidence = confidence;
    }
  }
  
  // Enrich AI Analysis result
  if (aiAnalysisResult && aiAnalysisRawResult) {
    aiAnalysisResult.rawData = aiAnalysisRawResult;
    
    const severity = extractSeverity(aiAnalysisRawResult);
    if (severity !== "unknown") {
      aiAnalysisResult.severity = severity;
    }
    
    const confidence = extractConfidence(aiAnalysisRawResult);
    if (confidence !== undefined) {
      aiAnalysisResult.confidence = confidence;
    }
  }
  
  console.log('[API Enricher] Enrichment complete');
}
