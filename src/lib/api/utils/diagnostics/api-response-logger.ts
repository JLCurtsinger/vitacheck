
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
 * Compare expected schema with actual response
 * Returns a list of discrepancies found
 */
export function validateApiSchema(
  expected: Record<string, any>,
  actual: Record<string, any>,
  path: string = ''
): string[] {
  const discrepancies: string[] = [];
  
  // Check for missing expected fields in actual
  for (const key of Object.keys(expected)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!(key in actual)) {
      discrepancies.push(`Missing expected field: ${currentPath}`);
      continue;
    }
    
    // If both are objects, recurse
    if (
      typeof expected[key] === 'object' && 
      expected[key] !== null && 
      typeof actual[key] === 'object' && 
      actual[key] !== null
    ) {
      discrepancies.push(...validateApiSchema(expected[key], actual[key], currentPath));
    }
    
    // Check for type mismatches
    else if (typeof expected[key] !== typeof actual[key]) {
      discrepancies.push(
        `Type mismatch for ${currentPath}: expected ${typeof expected[key]}, got ${typeof actual[key]}`
      );
    }
  }
  
  // Log unexpected fields (in actual but not expected)
  for (const key of Object.keys(actual)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (!(key in expected)) {
      discrepancies.push(`Unexpected field: ${currentPath}`);
    }
  }
  
  return discrepancies;
}

/**
 * Check if the response contains any meaningful interaction data
 */
export function hasValidInteractionData(response: any): boolean {
  // Check for common indicators of interaction data
  if (!response) return false;
  
  // Check for interaction array
  if (Array.isArray(response.interactions) && response.interactions.length > 0) {
    return true;
  }
  
  // Check for sources array with descriptions
  if (Array.isArray(response.sources) && 
      response.sources.some((s: any) => s.description && s.description.length > 10)) {
    return true;
  }
  
  // Check for fullInteractionType (RxNorm style)
  if (response.fullInteractionTypeGroup && 
      response.fullInteractionTypeGroup.length > 0 &&
      response.fullInteractionTypeGroup[0].fullInteractionType) {
    return true;
  }
  
  // Check for direct description field
  if (response.description && response.description.length > 10) {
    return true;
  }
  
  return false;
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
