/**
 * AI Literature Analysis Processor
 * 
 * Enhanced processor for AI literature analysis with improved validation, recovery mechanisms,
 * and detailed logging for diagnostic purposes.
 */

import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { logFullApiResponse, logParsingIssue } from '../diagnostics/api-response-logger';
import { extractSourcesFromInteractions } from '../data-sources/source-extractor';

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
  sources: InteractionSource[],
  // New parameter to receive fallback sources data
  fallbackSources?: {
    rxnormResult?: StandardizedApiResponse | null,
    suppaiResult?: StandardizedApiResponse | null, 
    fdaResult?: StandardizedApiResponse | null,
    adverseEventsResult?: any | null
  }
): void {
  console.log('[AI Literature] Starting AI Literature Analysis processing', {
    hasDirectAnalysis: !!aiAnalysisResult && !!aiAnalysisRawResult,
    hasFallbackData: !!fallbackSources && (
      !!fallbackSources.rxnormResult || 
      !!fallbackSources.suppaiResult || 
      !!fallbackSources.fdaResult || 
      !!fallbackSources.adverseEventsResult
    ),
    currentSourceCount: sources.length
  });
  
  // Check if we have direct AI analysis data
  const hasDirectAnalysis = !!aiAnalysisResult && !!aiAnalysisRawResult;
  
  // Check if fallback data is available when direct analysis is missing
  const hasFallbackData = !hasDirectAnalysis && fallbackSources && 
    (fallbackSources.rxnormResult || fallbackSources.suppaiResult || 
     fallbackSources.fdaResult || fallbackSources.adverseEventsResult);
  
  // Log data availability status
  console.log(`[AI Literature] Direct analysis available: ${hasDirectAnalysis}, Fallback data available: ${hasFallbackData}`);
  
  // If no AI Literature data and no fallback, exit early
  if (!hasDirectAnalysis && !hasFallbackData) {
    console.log('[AI Literature] No AI Literature Analysis data or fallback data available');
    return;
  }

  try {
    // CASE 1: We have direct AI analysis data - process it normally
    if (hasDirectAnalysis) {
      console.log('[AI Literature] Processing direct AI analysis data');
      processPrimaryAiLiteratureData(aiAnalysisResult!, aiAnalysisRawResult!, sources);
      return;
    }
    
    // CASE 2: We need to use fallback data to create a synthetic AI literature entry
    if (hasFallbackData) {
      console.log('[AI Literature] Processing fallback data');
      processFallbackData(fallbackSources!, sources);
      return;
    }
  } catch (error) {
    console.error('[AI Literature] Unhandled error in processor:', error);
    
    // Even if we encounter an error, add a diagnostic source
    const errorSource: InteractionSource = {
      name: 'AI Literature Analysis',
      severity: 'unknown',
      description: 'An error occurred while processing AI literature analysis data',
      confidence: 10,
      isReliable: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      fallbackMode: true,
      fallbackReason: 'Error during processing'
    };
    
    sources.push(errorSource);
    console.log('[AI Literature] Added error source due to processing exception');
    
    // Log the full error for debugging
    logParsingIssue('AI Literature', aiAnalysisRawResult, error);
  }

  // Log final state
  console.log('[AI Literature] Processing complete', {
    finalSourceCount: sources.length,
    hasAiLiteratureSource: sources.some(s => s.name === 'AI Literature Analysis')
  });
}

/**
 * Process primary AI Literature data when available directly
 */
function processPrimaryAiLiteratureData(
  aiAnalysisResult: StandardizedApiResponse,
  aiAnalysisRawResult: any,
  sources: InteractionSource[]
): void {
  // Log the full raw data for debugging purposes
  logFullApiResponse('AI Literature', aiAnalysisRawResult, 'pre-processing');
  
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
  
  // Add detailed reliability logging with full validation context
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
    fallbackMode: false
  };
  
  // Add debug log before pushing
  logSourceSeverityIssues(source, 'Before push - AI Literature');
  
  // Add the source to our collection
  sources.push(source);
  
  console.log(`[AI Literature] Added source with confidence ${confidenceScore}% and reliability: ${validationResult.isReliable}`);
}

/**
 * Process fallback data when direct AI analysis is not available
 * Creates a synthetic AI Literature source from available data
 */
function processFallbackData(
  fallbackSources: {
    rxnormResult?: StandardizedApiResponse | null,
    suppaiResult?: StandardizedApiResponse | null, 
    fdaResult?: StandardizedApiResponse | null,
    adverseEventsResult?: any | null
  },
  sources: InteractionSource[]
): void {
  console.log('[AI Literature] Processing fallback data to create synthetic AI Literature source');
  
  // Extract useful data from other sources 
  const availableSources = extractSourcesFromInteractions(fallbackSources);
  
  // If no sources available, exit
  if (availableSources.length === 0) {
    console.log('[AI Literature] No valid fallback sources available');
    return;
  }
  
  // Generate a fallback description from available sources
  const { description, severity, confidence } = generateFallbackAnalysis(availableSources);
  
  // Create a synthetic AI Literature source
  const syntheticSource: InteractionSource = {
    name: 'AI Literature Analysis',
    severity: severity || 'unknown',
    description,
    confidence: confidence,
    isReliable: true, // We consider fallback data from other sources to be reliable
    fallbackMode: true, // Mark as fallback so UI can adapt if needed
    fallbackReason: 'Generated from available data sources',
    hasInsight: true,
    sources: availableSources.map(s => s.name)
  };
  
  // Add the synthetic source
  sources.push(syntheticSource);
  
  console.log(`[AI Literature] Added synthetic source with confidence ${confidence}% using ${availableSources.length} fallback sources`);
}

/**
 * Generate a fallback analysis from available sources
 */
function generateFallbackAnalysis(sources: InteractionSource[]): {
  description: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidence: number;
} {
  // Default result
  let result = {
    description: 'Based on available data, a potential interaction may exist.',
    severity: 'unknown' as "safe" | "minor" | "moderate" | "severe" | "unknown",
    confidence: 60
  };
  
  // Start building description parts
  const descriptionParts: string[] = [];
  
  // Track if we have found any evidence of interaction
  let hasInteractionEvidence = false;
  let maxSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  let severityCount = {
    safe: 0,
    minor: 0,
    moderate: 0,
    severe: 0,
    unknown: 0
  };
  
  // Process each source and extract useful information
  sources.forEach(source => {
    // Count severity levels
    if (source.severity) {
      severityCount[source.severity]++;
      
      // Track the highest severity level found
      if (source.severity === 'severe') maxSeverity = 'severe';
      else if (source.severity === 'moderate' && maxSeverity !== 'severe') maxSeverity = 'moderate';
      else if (source.severity === 'minor' && maxSeverity !== 'severe' && maxSeverity !== 'moderate') maxSeverity = 'minor';
      else if (source.severity === 'safe' && maxSeverity === 'unknown') maxSeverity = 'safe';
    }
    
    // Extract description if available
    if (source.description && source.description.length > 20) {
      // Clean up the description to avoid weird text artifacts
      const cleanedDesc = source.description
        .replace(/\s+/g, ' ')
        .replace(/(an error occurred|unable to analyze|timed out)/i, '')
        .trim();
      
      if (cleanedDesc.length > 20) {
        descriptionParts.push(cleanedDesc);
      }
    }
    
    // Check if this source indicates an interaction
    if (source.severity && source.severity !== 'safe' && source.severity !== 'unknown') {
      hasInteractionEvidence = true;
    }
  });
  
  // Use severity count to determine final severity
  if (severityCount.severe > 0) result.severity = 'severe';
  else if (severityCount.moderate > 0) result.severity = 'moderate';
  else if (severityCount.minor > 0) result.severity = 'minor';
  else if (severityCount.safe > 0) result.severity = 'safe';
  
  // Adjust confidence based on amount and quality of data
  const totalSeverityVotes = severityCount.safe + severityCount.minor + 
    severityCount.moderate + severityCount.severe;
  
  if (totalSeverityVotes > 2) result.confidence = 80;
  else if (totalSeverityVotes > 0) result.confidence = 70;
  else result.confidence = 50;
  
  // Create a comprehensive description
  if (descriptionParts.length > 0) {
    // Select the most informative description (usually the longest one)
    descriptionParts.sort((a, b) => b.length - a.length);
    result.description = descriptionParts[0];
    
    // Add a synthetic introduction
    if (hasInteractionEvidence) {
      switch (result.severity) {
        case 'severe':
          result.description = `Analysis indicates a potentially severe interaction. ${result.description}`;
          break;
        case 'moderate':
          result.description = `Analysis indicates a moderate interaction may exist. ${result.description}`;
          break;
        case 'minor':
          result.description = `Analysis indicates a minor interaction may occur. ${result.description}`;
          break;
        default:
          result.description = `Analysis of available data shows a potential interaction. ${result.description}`;
      }
    } else {
      result.description = `Analysis of available data: ${result.description}`;
    }
  } else {
    // Fallback description when no useful text is available
    if (hasInteractionEvidence) {
      result.description = `Analysis of available data sources indicates a potential ${result.severity} interaction may exist between these substances. No detailed description is available.`;
    } else {
      result.description = `Analysis of available data did not yield specific details about potential interactions between these substances.`;
    }
  }
  
  return result;
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
  
  // IMPORTANT: We're now being much more lenient with what we consider reliable
  // Because we want to show as much data as possible
  let isReliable = true;
  let reason = "Accepted as reliable data";
  
  // Only disqualify for major issues
  if (!description || description.length < 10) {
    isReliable = false;
    reason = "Missing or too short description";
  }
  else if (containsErrorMessage && !hasInsight) {
    isReliable = false;
    reason = "Contains error messages without meaningful content";
  }
  else if (confidenceScore < 15) {
    isReliable = false;
    reason = "Extremely low confidence score";
  }
  
  return {
    isReliable,
    reason,
    containsErrorMessage,
    hasInsight
  };
}
