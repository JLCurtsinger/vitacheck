
/**
 * Types for medication suggestions
 */
export interface MedicationSuggestion {
  name: string;
  source: string;
}

/**
 * In-memory cache interface
 */
export interface SuggestionCache {
  [key: string]: MedicationSuggestion[];
}
