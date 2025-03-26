
/**
 * Debug Logger
 * 
 * Provides utilities for logging debug information about API responses
 * and interaction sources.
 */

import { InteractionSource, StandardizedApiResponse } from '../types';

// Debug flag - set to true to enable additional logging
const DEBUG_ENABLED = true;

/**
 * Logs details about sources with missing or unexpected severity values
 */
export function logSourceSeverityIssues(source: any, context: string = ''): void {
  if (!DEBUG_ENABLED) return;
  
  if (!source) {
    console.warn(`[${context}] Source is null or undefined`);
    return;
  }
  
  if (!('severity' in source) || source.severity === undefined) {
    console.warn(`[${context}] Source missing severity property:`, {
      name: source.name || 'Unknown',
      source: source
    });
  }
  
  if (source.severity && typeof source.severity !== 'string') {
    console.warn(`[${context}] Source has invalid severity type:`, {
      name: source.name || 'Unknown',
      severity: source.severity,
      type: typeof source.severity
    });
  }
}

/**
 * Logs details about API responses before standardization
 */
export function logApiResponseFormat(
  response: any, 
  apiName: string
): void {
  if (!DEBUG_ENABLED) return;
  
  console.debug(`[API Format] ${apiName} response structure:`, {
    isNull: response === null,
    hasData: response !== null,
    properties: response ? Object.keys(response) : [],
    hasSeverity: response && 'severity' in response,
    hasConfidence: response && 'confidence' in response,
    hasDescription: response && 'description' in response
  });
}

/**
 * Logs details about standardized responses
 */
export function logStandardizedResponse(
  response: StandardizedApiResponse | null,
  apiName: string
): void {
  if (!DEBUG_ENABLED) return;
  
  if (!response) {
    console.debug(`[Standardized] ${apiName}: No response to standardize`);
    return;
  }
  
  console.debug(`[Standardized] ${apiName} response:`, {
    source: response.source,
    severity: response.severity,
    hasDescription: !!response.description,
    descriptionLength: response.description ? response.description.length : 0,
    confidence: response.confidence,
    processed: response.processed,
    hasEventData: !!response.eventData
  });
}
