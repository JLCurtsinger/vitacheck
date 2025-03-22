
import { Handler } from "@netlify/functions";
import { corsHeaders, handleCorsRequest } from './utils/cors-utils';
import { createErrorResponse } from './utils/error-utils';
import { handleOperation } from './services/operation-service';

const handler: Handler = async (event, context) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsRequest(event);
  if (corsResponse) {
    return corsResponse;
  }
  
  try {
    // Parse request body
    if (!event.body) {
      return createErrorResponse(400, 'Request body is missing');
    }
    
    const requestBody = JSON.parse(event.body);
    const { operation } = requestBody;
    
    console.log(`🔍 RxNorm: Processing request:`, { 
      operation,
      requestBody
    });
    
    return await handleOperation(operation, requestBody);
    
  } catch (error) {
    console.error('❌ RxNorm: Error in proxy:', error);
    
    return createErrorResponse(500, error.message, error.stack);
  }
};

export { handler };
