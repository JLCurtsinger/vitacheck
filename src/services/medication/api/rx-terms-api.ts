
import { MedicationSuggestion } from "../types";
import { getCachedSuggestions, cacheSuggestions } from "../cache";
import { fuzzyMatch } from "../utils";

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
    const url = '/.netlify/functions/rxnorm';
    const body = JSON.stringify({ 
      operation: 'suggest',
      term: query.trim()
    });
    console.log('📡 RxTerms: about to fetch', { url, body });
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });
      console.log('✅ RxTerms: fetch completed', { status: response.status, ok: response.ok });
    } catch (err) {
      console.error('❌ RxTerms: fetch error', err);
      throw err;
    }

    if (!response.ok) {
      console.error('❌ RxTerms API error:', response.status);
      return [];
    }

    let data;
    try {
      data = await response.json();
      console.log('📦 RxTerms: parsed response', { hasResults: !!data?.results, resultCount: data?.results?.length });
    } catch (err) {
      console.error('❌ RxTerms: JSON parse error', err);
      return [];
    }
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
