
/**
 * API Helper Functions
 * Utility functions for API operations
 */

/**
 * Delay function to prevent rate limiting
 * @param ms - milliseconds to delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Safely parse JSON response with error handling
 */
export function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return null;
  }
}

/**
 * Create a standardized error object
 */
export function createApiError(message: string, details?: any): any {
  return {
    error: true,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}
