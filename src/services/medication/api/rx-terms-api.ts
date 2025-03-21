
import { MedicationSuggestion } from "../types";
import { getCachedSuggestions, cacheSuggestions } from "../cache";

/**
 * Fetch medication suggestions from RxTerms API via our serverless function
 */
export async function fetchRxTermsSuggestions(query: string): Promise<MedicationSuggestion[]> {
  try {
    // Skip API call for very short queries
    if (query.length < 2) return [];

    // Check cache first
    const cachedResults = getCachedSuggestions("rxterms", query);
    if (cachedResults) {
      return cachedResults;
    }

    console.log('🔍 Fetching RxTerms suggestions for:', query);
    const response = await fetch('/.netlify/functions/rxnorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'suggest',
        term: query.trim()
      })
    });

    if (!response.ok) {
      console.error('❌ RxTerms API error:', response.status);
      return [];
    }

    const data = await response.json();
    const suggestions = (data?.results || [])
      .slice(0, 8)
      .map((result: any) => ({
        name: result.displayTermType === '0' ? result.displayName : `${result.displayName} (${result.rxcui})`,
        source: 'RxTerms'
      }));

    // Cache the results
    cacheSuggestions("rxterms", query, suggestions);
    
    return suggestions;
  } catch (error) {
    console.error('Error fetching RxTerms suggestions:', error);
    return [];
  }
}
