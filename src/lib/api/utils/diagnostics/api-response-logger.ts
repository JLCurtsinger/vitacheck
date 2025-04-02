
/**
 * API Response Logger
 * 
 * Provides comprehensive logging utilities for API responses to help diagnose
 * parsing and data structure issues.
 */

import { writeToDebugLog } from './debug-file-logger';

// Enable detailed debug logging (can be toggled based on environment)
const ENABLE_DETAILED_LOGGING = true;
const MAX_RESPONSE_LOG_LENGTH = 1000; // Truncate long responses to avoid log overflow

/**
 * Log full API response data for debugging purposes
 */
export function logFullApiResponse(
  source: string, 
  response: any, 
  context: string = ''
): void {
  if (!ENABLE_DETAILED_LOGGING) return;
  
  // Create a safe copy of the response that won't cause circular reference issues
  let safeResponse;
  try {
    // First try to stringify and parse to remove any circular references
    safeResponse = JSON.parse(JSON.stringify(response));
  } catch (e) {
    // If circular references exist, create a simplified object with just the keys
    safeResponse = {
      __error: "Circular reference detected - showing keys only",
      keys: Object.keys(response)
    };
  }
  
  // Get formatted response for logging
  const responseStr = JSON.stringify(safeResponse, null, 2);
  const truncatedResponse = responseStr.length > MAX_RESPONSE_LOG_LENGTH
    ? responseStr.substring(0, MAX_RESPONSE_LOG_LENGTH) + "... [truncated]"
    : responseStr;
  
  console.log(`[API Debug] ${source} Response ${context ? `(${context})` : ''}:`, truncatedResponse);
  
  // Also write to debug log file for persistent storage
  writeToDebugLog('api_responses', `${source}_${Date.now()}`, {
    timestamp: new Date().toISOString(),
    source,
    context,
    response: safeResponse
  });
}

/**
 * Log parsing issues that might lead to interaction detection failures
 */
export function logParsingIssue(
  source: string, 
  rawData: any, 
  error: string | Error
): void {
  console.error(`[Parser Error] ${source} parsing failed:`, 
    error instanceof Error ? error.message : error);
  
  // Log the problematic data structure
  logFullApiResponse(source, rawData, 'parsing_error');
  
  // Write to debug log for further analysis
  writeToDebugLog('parsing_errors', `${source}_${Date.now()}`, {
    timestamp: new Date().toISOString(),
    source,
    error: error instanceof Error ? { 
      message: error.message, 
      stack: error.stack 
    } : error,
    rawData
  });
}
