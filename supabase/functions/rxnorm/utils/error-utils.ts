
import { corsHeaders } from "./cors.ts";

/**
 * Creates a standardized error response
 * @param status - HTTP status code
 * @param message - Error message
 * @param details - Additional error details
 */
export function createErrorResponse(status: number, message: string, details?: string): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      details: details || "",
      status: "error"
    }),
    { 
      status, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
