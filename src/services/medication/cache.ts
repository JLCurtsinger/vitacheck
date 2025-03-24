
import { MedicationSuggestion, SuggestionCache } from "./types";

// In-memory cache for quick access to previously fetched suggestions
// Initialize with the correct type structure
const suggestionCache: Record<string, MedicationSuggestion[]> = {};

/**
 * Get suggestions from cache
 */
export function getCachedSuggestions(
  source: string,
  query: string
): MedicationSuggestion[] | null {
  const cacheKey = `${source}:${query.toLowerCase()}`;
  if (suggestionCache[cacheKey]) {
    console.log(`📦 Using cached ${source} results for:`, query);
    return suggestionCache[cacheKey];
  }
  return null;
}

/**
 * Store suggestions in cache
 */
export function cacheSuggestions(
  source: string,
  query: string,
  suggestions: MedicationSuggestion[]
): void {
  const cacheKey = `${source}:${query.toLowerCase()}`;
  suggestionCache[cacheKey] = suggestions;
}

/**
 * Store combined suggestions in cache
 */
export function cacheCombinedSuggestions(
  query: string,
  suggestions: MedicationSuggestion[]
): void {
  const cacheKey = `combined:${query.toLowerCase()}`;
  suggestionCache[cacheKey] = suggestions;
}

/**
 * Get combined suggestions from cache
 */
export function getCachedCombinedSuggestions(
  query: string
): MedicationSuggestion[] | null {
  const cacheKey = `combined:${query.toLowerCase()}`;
  if (suggestionCache[cacheKey]) {
    return suggestionCache[cacheKey];
  }
  return null;
}
