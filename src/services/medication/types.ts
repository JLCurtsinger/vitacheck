
/**
 * Represents a medication suggestion from autocomplete
 */
export interface MedicationSuggestion {
  /** The display name of the medication */
  name: string;
  
  /** The source of the suggestion (e.g., RxTerms, SUPP.AI) */
  source: string;
  
  /** The generic name, if this is a brand name medication */
  genericName?: string;
  
  /** Whether this is a brand name medication */
  isBrand?: boolean;
}

/**
 * Cache structure for storing medication suggestions
 */
export interface SuggestionCache {
  timestamp: number;
  results: MedicationSuggestion[];
}
