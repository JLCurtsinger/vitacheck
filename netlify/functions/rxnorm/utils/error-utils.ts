
import { corsHeaders } from './cors-utils';

/**
 * Creates a standardized error response
 */
export function createErrorResponse(status: number, errorMessage: string, details?: string) {
  return {
    statusCode: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      error: errorMessage,
      details: details || '',
      status: 'error'
    })
  };
}
