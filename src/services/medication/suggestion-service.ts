
import { MedicationSuggestion } from "./types";
import { fetchRxTermsSuggestions } from "./api/rx-terms-api";
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
    // Call RxTerms (primary source for autocomplete)
    const rxResults: MedicationSuggestion[] = await fetchRxTermsSuggestions(query) ?? [];
    
    console.log("SuggestionService: RxTerms returned", { count: rxResults.length, results: rxResults });

    // SUPP.AI is disabled for autocomplete: treat as no suggestions.
    // This keeps the merge/dedupe structure stable while ensuring only RxTerms results are used.
    const suppAiResults: MedicationSuggestion[] = [];

    // Merge results: RxTerms first, then append non-duplicate SUPP.AI suggestions
    // (SUPP.AI is empty, so this effectively just returns RxTerms results)
    const merged: MedicationSuggestion[] = [...rxResults];
    
    // Append SUPP.AI suggestions that aren't duplicates
    // (This block is intentionally kept for structural consistency, but suppAiResults is always empty)
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
