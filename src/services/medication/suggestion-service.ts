
import { MedicationSuggestion } from "./types";
import { fetchRxTermsSuggestions } from "./api/rx-terms-api";
import { fetchSuppAiSuggestions } from "./api/supp-ai-api";
import { sortSuggestionsByRelevance, applyFuzzyFiltering, debounce } from "./utils";
import { getCachedCombinedSuggestions, cacheCombinedSuggestions } from "./cache";
import { getMedicationNamePair } from "./brand-to-generic";
import { spellcheckMedication } from "@/utils/medication-formatter";

// Enhanced session-level cache for medication suggestions
const sessionSuggestionsCache = new Map<string, MedicationSuggestion[]>();

/**
 * Raw function to fetch medication suggestions without debouncing
 * This allows us to apply debouncing at the appropriate level
 */
async function fetchMedicationSuggestionsRaw(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  // Apply spelling correction to the query
  const correctedQuery = spellcheckMedication(query);
  const queryToUse = correctedQuery !== query ? correctedQuery : query;
  
  if (correctedQuery !== query) {
    console.log(`Corrected query from "${query}" to "${correctedQuery}"`);
  }
  
  // Check session cache first (faster than localStorage cache)
  if (sessionSuggestionsCache.has(queryToUse)) {
    console.log(`Using session cache for query: ${queryToUse}`);
    return sessionSuggestionsCache.get(queryToUse)!;
  }
  
  try {
    // Attempt to fetch from local storage cache (if not in session cache)
    const cachedResults = getCachedCombinedSuggestions(queryToUse);
    if (cachedResults) {
      // Store in session cache for faster future lookups
      sessionSuggestionsCache.set(queryToUse, cachedResults);
      return cachedResults;
    }
    
    // Fetch suggestions concurrently from multiple sources
    const [rxTermsResults, suppAiResults] = await Promise.all([
      fetchRxTermsSuggestions(queryToUse),
      fetchSuppAiSuggestions(queryToUse)
    ]);
    
    // Combine results
    let combinedResults = [...rxTermsResults];
    
    // Add SUPP.AI results, avoiding duplicates
    suppAiResults.forEach(supp => {
      if (!combinedResults.some(item => item.name.toLowerCase() === supp.name.toLowerCase())) {
        combinedResults.push(supp);
      }
    });
    
    // Add brand/generic information to the suggestions
    combinedResults = combinedResults.map(suggestion => {
      const { displayName, genericName, isBrand } = getMedicationNamePair(suggestion.name);
      
      if (isBrand) {
        return {
          ...suggestion,
          name: displayName,
          genericName: genericName,
          isBrand: true
        };
      }
      
      return suggestion;
    });
    
    // Apply fuzzy filtering for all results that weren't direct API matches
    const fuzzyFilteredResults = applyFuzzyFiltering(combinedResults, queryToUse);
    
    // Sort by relevance
    const sortedResults = sortSuggestionsByRelevance(fuzzyFilteredResults, queryToUse);
    
    // Cache the combined results (both in localStorage and session)
    cacheCombinedSuggestions(queryToUse, sortedResults);
    sessionSuggestionsCache.set(queryToUse, sortedResults);
    
    return sortedResults;
  } catch (error) {
    console.error('Error fetching medication suggestions:', error);
    return [];
  }
}

/**
 * Debounced version of fetchMedicationSuggestionsRaw with 400ms delay
 */
export const getMedicationSuggestions = debounce(fetchMedicationSuggestionsRaw, 400);

// Re-export other important functions
export { debounce } from "./utils";
export { getRecentSearches, saveToRecentSearches } from "./storage";
export type { MedicationSuggestion } from "./types";
