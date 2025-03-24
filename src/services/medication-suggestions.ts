
/**
 * Barrel file to maintain backward compatibility with existing imports
 */
export {
  getMedicationSuggestions,
  debounce,
  getRecentSearches,
  saveToRecentSearches,
  type MedicationSuggestion
} from "./medication/suggestion-service";

// Export brand-to-generic utilities for use in other modules
export {
  getGenericName, 
  isBrandName,
  getMedicationNamePair
} from "./medication/brand-to-generic";
