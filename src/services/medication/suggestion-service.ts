
import { MedicationSuggestion } from "./types";
import { fetchRxTermsSuggestions } from "./api/rx-terms-api";
import { fetchSuppAiSuggestions } from "./api/supp-ai-api";
import { sortSuggestionsByRelevance, applyFuzzyFiltering } from "./utils";
import { getCachedCombinedSuggestions, cacheCombinedSuggestions } from "./cache";
import { getMedicationNamePair } from "./brand-to-generic";
import { spellcheckMedication } from "@/utils/medication-formatter";

// Enhanced session-level cache for medication suggestions
const sessionSuggestionsCache = new Map<string, MedicationSuggestion[]>();

/**
 * Normalize suggestion name for deduplication (case-insensitive)
 */
function normalizeSuggestionName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Check if a suggestion already exists in the list (case-insensitive)
 */
function isDuplicate(suggestion: MedicationSuggestion, existing: MedicationSuggestion[]): boolean {
  const normalized = normalizeSuggestionName(suggestion.name);
  return existing.some(existing => normalizeSuggestionName(existing.name) === normalized);
}

/**
 * Fetch medication suggestions from multiple sources with fuzzy matching
 * RxTerms is primary; SUPP.AI is optional and non-blocking
 */
export async function getMedicationSuggestions(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Always call RxTerms (primary source)
    const rxTermsPromise = fetchRxTermsSuggestions(query);
    
    // Optionally call SUPP.AI in parallel (only for queries >= 3 chars)
    const suppAiPromise = query.length >= 3 
      ? fetchSuppAiSuggestions(query)
      : Promise.resolve([]);

    // Wait for both promises to settle (non-blocking)
    const [rxTermsResult, suppAiResult] = await Promise.allSettled([
      rxTermsPromise,
      suppAiPromise
    ]);

    // Extract RxTerms results (primary source - always use if available)
    let rxResults: MedicationSuggestion[] = [];
    if (rxTermsResult.status === 'fulfilled') {
      rxResults = rxTermsResult.value ?? [];
      console.log("SuggestionService: RxTerms returned", { count: rxResults.length, results: rxResults });
    } else {
      console.error("SuggestionService: RxTerms suggestions failed", rxTermsResult.reason);
    }

    // Extract SUPP.AI results (optional - only merge if successful)
    let suppAiResults: MedicationSuggestion[] = [];
    if (suppAiResult.status === 'fulfilled') {
      suppAiResults = suppAiResult.value ?? [];
      console.log("SuggestionService: SUPP.AI returned", { count: suppAiResults.length, results: suppAiResults });
    } else {
      // Log warning but don't block - this is expected behavior for timeouts/errors
      console.warn("SuggestionService: SUPP.AI suggestions unavailable (non-blocking)", suppAiResult.reason);
    }

    // Merge results: RxTerms first, then append non-duplicate SUPP.AI suggestions
    const merged: MedicationSuggestion[] = [...rxResults];
    
    // Append SUPP.AI suggestions that aren't duplicates
    for (const suppSuggestion of suppAiResults) {
      if (!isDuplicate(suppSuggestion, merged)) {
        merged.push(suppSuggestion);
      }
    }

    console.log("SuggestionService: merged results", { 
      rxTermsCount: rxResults.length, 
      suppAiCount: suppAiResults.length,
      mergedCount: merged.length 
    });

    return merged;
  } catch (error) {
    console.error("SuggestionService: unexpected error", error);
    return [];
  }
}

// Re-export other important functions
export { debounce } from "./utils";
export { getRecentSearches, saveToRecentSearches } from "./storage";
export type { MedicationSuggestion } from "./types";
