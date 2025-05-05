
/**
 * AI Literature Analysis Processor
 * 
 * Enhanced processor for AI literature analysis with improved validation, recovery mechanisms,
 * and detailed logging for diagnostic purposes.
 */

import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { logFullApiResponse, logParsingIssue } from '../diagnostics/api-response-logger';

/**
 * Enhanced AI Literature Analysis processor with improved reliability checks
 * and detailed diagnostic logging
 * 
 * Processes and adds AI literature analysis data to the sources array,
 * implementing flexible schema validation and recovery mechanisms
 */
export function processAiLiteratureSources(
  aiAnalysisResult: StandardizedApiResponse | null,
  aiAnalysisRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!aiAnalysisResult || !aiAnalysisRawResult) {
    console.log('[AI Literature] No AI Literature Analysis data available');
    return;
  }

  // Log the full raw data for debugging purposes
  logFullApiResponse('AI Literature', aiAnalysisRawResult, 'pre-processing');
  
  try {
    // Extract confidence score, defaulting to 50 if not specified
    const confidenceScore = extractConfidenceScore(aiAnalysisRawResult, aiAnalysisResult);
    
    // Extract description and ensure it's a valid string
    const description = extractDescription(aiAnalysisResult);
    
    // Extract severity (may be null/unknown)
    const severity = extractSeverity(aiAnalysisResult, aiAnalysisRawResult);
    
    // Perform enhanced validation for reliability
    const validationResult = validateAiLiteratureResult(
      description,
      confidenceScore,
      severity,
      aiAnalysisRawResult
    );
    
    // New: Add detailed reliability logging with full validation context
    console.log(`[AI Literature] Reliability validation:`, {
      confidence: confidenceScore,
      descriptionLength: description?.length || 0,
      severity: severity,
      containsErrorMessage: validationResult.containsErrorMessage,
      hasInsight: validationResult.hasInsight,
      isReliable: validationResult.isReliable,
      validationReason: validationResult.reason
    });

    // Always include the AI result in sources, but mark its reliability
    const source: InteractionSource = {
      name: 'AI Literature Analysis',
      severity: severity || 'unknown',
      description: description || 'Analysis unavailable',
      confidence: confidenceScore,
      isReliable: validationResult.isReliable,
      rawData: aiAnalysisRawResult,
      // Include validation metadata for debugging and UI display
      validationReason: !validationResult.isReliable ? validationResult.reason : undefined,
      hasInsight: validationResult.hasInsight,
    };
    
    // Add debug log before pushing
    logSourceSeverityIssues(source, 'Before push - AI Literature');
    
    // Add the source to our collection
    sources.push(source);
    
    console.log(`[AI Literature] Added source with confidence ${confidenceScore}% and reliability: ${validationResult.isReliable}`);
    
  } catch (error) {
    console.error('[AI Literature] Unhandled error in processor:', error);
    
    // Even if we encounter an error, add a diagnostic source
    const errorSource: InteractionSource = {
      name: 'AI Literature Analysis',
      severity: 'unknown',
      description: 'An error occurred while processing AI literature analysis data',
      confidence: 10,
      isReliable: false,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
    
    sources.push(errorSource);
    console.log('[AI Literature] Added error source due to processing exception');
    
    // Log the full error for debugging
    logParsingIssue('AI Literature', aiAnalysisRawResult, error);
  }
}

/**
 * Extract the confidence score from various possible locations in the response
 */
function extractConfidenceScore(
  rawResult: any,
  standardizedResult: StandardizedApiResponse
): number {
  // Check all possible locations for confidence score
  const confidence =
    rawResult.confidence ||
    standardizedResult.confidence ||
    (rawResult.result?.confidence) ||
    // If nested in a specific schema
    (rawResult.data?.confidence) ||
    (rawResult.metadata?.confidence) ||
    // Default value if not found
    50;
    
  // Ensure it's a number between 0-100
  if (typeof confidence === 'string') {
    return parseInt(confidence, 10) || 50;
  }
  
  return typeof confidence === 'number' ? confidence : 50;
}

/**
 * Extract the description from the result, with fallbacks
 */
function extractDescription(result: StandardizedApiResponse): string | null {
  if (!result) return null;
  
  // Direct access
  if (result.description && typeof result.description === 'string') {
    return result.description;
  }
  
  // Look in standard locations
  const rawData = result.rawData;
  if (rawData) {
    // Check common paths in various schemas
    if (rawData.result?.description) return rawData.result.description;
    if (rawData.description) return rawData.description;
    if (rawData.data?.description) return rawData.data.description;
    if (rawData.text) return rawData.text;
    if (rawData.content) return rawData.content;
    
    // For OpenAI-like responses
    if (rawData.choices && Array.isArray(rawData.choices) && rawData.choices.length > 0) {
      const message = rawData.choices[0].message?.content;
      if (message) return message;
    }
  }
  
  return null;
}

/**
 * Extract severity information from various possible locations
 */
function extractSeverity(
  result: StandardizedApiResponse, 
  rawResult: any
): "safe" | "minor" | "moderate" | "severe" | "unknown" | null {
  // Valid severity values
  const validSeverities = ["safe", "minor", "moderate", "severe", "unknown"];
  
  // Check result object first
  if (result.severity && validSeverities.includes(result.severity)) {
    return result.severity as any;
  }
  
  // Check raw data
  if (rawResult) {
    // Direct property
    if (rawResult.severity && validSeverities.includes(rawResult.severity)) {
      return rawResult.severity as any;
    }
    
    // Nested in result
    if (rawResult.result?.severity && validSeverities.includes(rawResult.result.severity)) {
      return rawResult.result.severity as any;
    }
    
    // Parse from description if it starts with "Severity level: "
    const description = extractDescription(result);
    if (description && description.toLowerCase().includes("severity level:")) {
      const match = description.match(/severity level:\s*(\w+)/i);
      if (match && match[1] && validSeverities.includes(match[1].toLowerCase())) {
        return match[1].toLowerCase() as any;
      }
    }
  }
  
  return null;
}

/**
 * Validate AI Literature result and determine its reliability
 */
function validateAiLiteratureResult(
  description: string | null,
  confidenceScore: number,
  severity: string | null,
  rawResult: any
): {
  isReliable: boolean;
  reason: string;
  containsErrorMessage: boolean;
  hasInsight: boolean;
} {
  // Check if description contains error messages
  const errorPatterns = [
    /error occurred/i,
    /unable to analyze/i,
    /timed out/i,
    /failed/i,
    /invalid/i,
    /no valid response/i,
    /could not process/i,
    /unexpected format/i
  ];
  
  // See if any error patterns match
  const containsErrorMessage = description ? 
    errorPatterns.some(pattern => pattern.test(description)) : 
    true; // If no description, assume error
  
  // Check if description contains meaningful insight keywords
  const insightPatterns = [
    /study/i,
    /research/i,
    /evidence/i,
    /risk/i,
    /clinical/i,
    /literature/i,
    /publication/i,
    /journal/i,
    /mechanism/i,
    /interact/i
  ];
  
  // Does it contain meaningful content?
  const hasInsight = description ? 
    insightPatterns.some(pattern => pattern.test(description)) : 
    false;
  
  // Determine reliability using multiple factors
  let isReliable = false;
  let reason = "";
  
  // Start with true, then disqualify based on checks
  if (!description || description.length < 20) {
    isReliable = false;
    reason = "Missing or too short description";
  }
  else if (containsErrorMessage) {
    isReliable = false;
    reason = "Contains error messages";
  }
  else if (confidenceScore < 20) {
    isReliable = false;
    reason = "Extremely low confidence score";
  }
  else if (!hasInsight && !severity) {
    isReliable = false;
    reason = "Lacks meaningful insight and severity assessment";
  }
  else {
    // Default to reliable if it passes all checks above
    isReliable = true;
    reason = "Passed reliability checks";
    
    // Conditional reliability based on confidence
    if (confidenceScore < 60) {
      // For lower confidence sources, require more validation
      if (!hasInsight || !severity) {
        isReliable = false;
        reason = `Low confidence (${confidenceScore}%) and insufficient supporting evidence`;
      }
    }
  }
  
  return {
    isReliable,
    reason,
    containsErrorMessage,
    hasInsight
  };
}
