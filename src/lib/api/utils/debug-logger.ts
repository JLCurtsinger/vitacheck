
import { InteractionSource, StandardizedApiResponse } from '../types';

// Debug flag check
const isDebug = typeof window !== 'undefined' ? 
  localStorage.getItem('DEBUG') === 'true' : 
  process.env.DEBUG === 'true';

/**
 * Logs issues with source severity
 */
export function logSourceSeverityIssues(source: InteractionSource, context: string): void {
  if (isDebug && !source.severity) {
    console.warn(`[${context}] Source missing severity:`, source);
  }
}

/**
 * Logs API response format
 */
export function logApiResponseFormat(response: any, sourceName: string): void {
  if (!isDebug) return;
  
  if (!response) {
    console.log(`[API Format] ${sourceName} response is null or undefined`);
    return;
  }
  
  // Log the shape/structure of the response
  const responseKeys = Object.keys(response);
  console.log(`[API Format] ${sourceName} response has ${responseKeys.length} root keys:`, responseKeys);
  
  // Check for interactions field
  if (response.interactions) {
    console.log(`[API Format] ${sourceName} has 'interactions' field with ${response.interactions.length} items`);
  }
  
  // Check for fullInteractionTypeGroup field (RxNorm format)
  if (response.fullInteractionTypeGroup) {
    console.log(`[API Format] ${sourceName} has 'fullInteractionTypeGroup' with ${response.fullInteractionTypeGroup.length} groups`);
  }
  
  // Check for sources field
  if (response.sources) {
    console.log(`[API Format] ${sourceName} has 'sources' field with ${response.sources.length} items`);
  }
}

/**
 * Logs standardized API response
 */
export function logStandardizedResponse(response: StandardizedApiResponse | null, sourceName: string): void {
  if (!isDebug) return;
  
  if (!response) {
    console.log(`[Standardized] ${sourceName} standardized response is null`);
    return;
  }
  
  console.log(`[Standardized] ${sourceName} response:`, {
    sources: response.sources, // Using 'sources' instead of 'source'
    severity: response.severity,
    hasDescription: !!response.description,
    confidence: response.confidence,
    processed: response.processed,
    hasEventData: !!response.eventData
  });
  
  // Check for missing required fields
  if (!response.severity) {
    console.warn(`[Standardized] ${sourceName} is missing severity!`);
  }
  
  if (!response.description) {
    console.warn(`[Standardized] ${sourceName} is missing description!`);
  }
}

/**
 * Logs diagnostic information for debugging purposes
 */
export function logDiagnosticInfo(message: string, data?: any): void {
  if (isDebug) {
    console.log(`[Diagnostic] ${message}`, data || '');
  }
}

/**
 * Logs standardized severity data
 */
export function logSeverityData(
  severity: string, 
  confidenceScore: number, 
  sources: InteractionSource[], 
  context: string
): void {
  if (!isDebug) return;
  
  console.log(`[Severity] ${context} - Final severity: ${severity}, confidence: ${confidenceScore}, sources: ${sources.length}`);
  
  // Check for any sources without severity
  const invalidSources = sources.filter(source => !source.severity);
  if (invalidSources.length > 0) {
    console.warn(`[Severity] ${context} - Found ${invalidSources.length} sources without severity!`);
  }
}
