
/**
 * API Response Logger
 * 
 * Specialized logging functions for API responses.
 */

// Import from standardizer if needed in the future
// For now, this file serves as a re-export location for any dedicated logging functions

/**
 * Log interaction data presence
 * Currently implemented in standardizer.ts but can be moved here in the future
 * if we need to expand logging capabilities
 */
export function logApiResponse(source: string, response: any): void {
  console.log(`[API Logger] ${source} response:`, response);
}

