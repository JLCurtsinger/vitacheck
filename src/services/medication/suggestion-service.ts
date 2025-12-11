
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
 * Fetch medication suggestions from multiple sources with fuzzy matching
 */
export async function getMedicationSuggestions(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    console.log("SuggestionService: calling RxTerms only", { query });
    const rxResults = await fetchRxTermsSuggestions(query);
    console.log("SuggestionService: RxTerms returned", { count: rxResults?.length ?? 0, results: rxResults });

    return rxResults ?? [];
  } catch (error) {
    console.error("SuggestionService: RxTerms suggestions failed", error);
    return [];
  }
}

// Re-export other important functions
export { debounce } from "./utils";
export { getRecentSearches, saveToRecentSearches } from "./storage";
export type { MedicationSuggestion } from "./types";
