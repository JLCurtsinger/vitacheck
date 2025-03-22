
/**
 * Fetches autocomplete suggestions from RxTerms API
 * @param term - Search term to get suggestions for
 */
export async function fetchRxTermsSuggestions(term: string): Promise<any> {
  console.log(`🔍 RxNorm: Fetching suggestions for term: ${term}`);
  
  // Build URL for RxTerms API call (optimized for autocomplete)
  const suggestUrl = `https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=${encodeURIComponent(term.trim())}&maxList=10`;
  console.log(`🌐 RxNorm: Making suggestions API request to: ${suggestUrl}`);
  
  try {
    const response = await fetch(suggestUrl, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RxNorm: Error fetching suggestions (${response.status})`);
      return null;
    }
    
    const data = await response.json();
    console.log(`⚙️ RxNorm: Suggestions response:`, data);
    
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
    
    return {
      count,
      results
    };
  } catch (error) {
    console.error(`❌ RxNorm: Failed to fetch suggestions for ${term}:`, error);
    return null;
  }
}
