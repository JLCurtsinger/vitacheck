
import { corsHeaders } from "../utils/cors.ts";

/**
 * Fetches autocomplete suggestions from RxTerms API
 * @param term - Search term to get suggestions for
 */
export async function fetchRxTermsSuggestions(term: string): Promise<Response> {
  console.log(`🔍 RXNORM: Fetching suggestions for term: ${term}`);
  
  // Build URL for RxTerms API call (optimized for autocomplete)
  const suggestUrl = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(term.trim())}&maxList=10`;
  console.log(`🌐 RXNORM: Making suggestions API request to: ${suggestUrl}`);
  
  try {
    const response = await fetch(suggestUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RXNORM: Error fetching suggestions (${response.status})`);
      return new Response(
        JSON.stringify({ 
          error: `API error (${response.status})`,
          status: "error" 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const data = await response.json();
    console.log(`⚙️ RXNORM: Suggestions response:`, data);
    
    // Format the response
    const [count, strings, suggestions, values] = data;
    
    // Transform into more usable format
    const results = strings.map((name: string, index: number) => {
      return {
        displayName: name,
        rxcui: values?.[index]?.[1] || null,
        displayTermType: values?.[index]?.[2] || '0'
      };
    });
    
    return new Response(
      JSON.stringify({
        count,
        results,
        status: "success"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(`❌ RXNORM: Failed to fetch suggestions for ${term}:`, error);
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
}
