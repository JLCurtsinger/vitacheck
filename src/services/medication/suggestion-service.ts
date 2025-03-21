
import { MedicationSuggestion } from "./types";
import { fetchRxTermsSuggestions } from "./api/rx-terms-api";
import { fetchSuppAiSuggestions } from "./api/supp-ai-api";
import { sortSuggestionsByRelevance } from "./utils";
import { getCachedCombinedSuggestions, cacheCombinedSuggestions } from "./cache";

/**
 * Fetch medication suggestions from multiple sources
 */
export async function getMedicationSuggestions(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    // Attempt to fetch from local storage cache
    const cachedResults = getCachedCombinedSuggestions(query);
    if (cachedResults) {
      return cachedResults;
    }
    
    // Fetch suggestions concurrently from multiple sources
    const [rxTermsResults, suppAiResults] = await Promise.all([
      fetchRxTermsSuggestions(query),
      fetchSuppAiSuggestions(query)
    ]);
    
    // Combine and deduplicate results
    const combinedResults = [...rxTermsResults];
    
    // Add SUPP.AI results, avoiding duplicates
    suppAiResults.forEach(supp => {
      if (!combinedResults.some(item => item.name.toLowerCase() === supp.name.toLowerCase())) {
        combinedResults.push(supp);
      }
    });
    
    // Sort by relevance
    const sortedResults = sortSuggestionsByRelevance(combinedResults, query);
    
    // Cache the combined results
    cacheCombinedSuggestions(query, sortedResults);
    
    return sortedResults;
  } catch (error) {
    console.error('Error fetching medication suggestions:', error);
    return [];
  }
}

// Re-export other important functions
export { debounce } from "./utils";
export { getRecentSearches, saveToRecentSearches } from "./storage";
export type { MedicationSuggestion } from "./types";
