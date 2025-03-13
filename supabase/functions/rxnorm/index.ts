
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, handleCorsRequest } from "./utils/cors.ts";
import { handleOperation } from "./services/endpoint-handler.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const reqBody = await req.json();
    return await handleOperation(reqBody);
  } catch (error) {
    console.error("❌ RXNORM: Error in proxy:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        status: "error"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
