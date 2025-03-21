
import { MedicationSuggestion } from "./types";

/**
 * Debounce function to prevent excessive API calls
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

/**
 * Sort suggestions by relevance
 */
export function sortSuggestionsByRelevance(
  suggestions: MedicationSuggestion[],
  query: string
): MedicationSuggestion[] {
  return suggestions.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (aName === queryLower && bName !== queryLower) return -1;
    if (bName === queryLower && aName !== queryLower) return 1;
    if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
    if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
    return aName.localeCompare(bName);
  });
}
