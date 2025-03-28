
import { StandardizedApiResponse } from '../../../types';
import { logParsingIssue } from '../../diagnostics/api-response-logger';

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
export function extractSeverity(rawResult: any): "safe" | "minor" | "moderate" | "severe" | "unknown" | null {
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
export function extractConfidence(rawResult: any, source: string): number {
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
