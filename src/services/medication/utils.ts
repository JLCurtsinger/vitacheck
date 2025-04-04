import { MedicationSuggestion } from "./types";

/**
 * Debounce function to prevent excessive API calls
 * Enhanced to handle async functions properly with Promise return type
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number = 400
): (...args: Parameters<F>) => Promise<ReturnType<F>> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let resolveList: Array<(value: ReturnType<F>) => void> = [];

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise(resolve => {
      resolveList.push(resolve);
      
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        const result = func(...args);
        
        // Resolve all promises with the result
        resolveList.forEach(r => r(result));
        resolveList = [];
      }, waitFor);
    });
  };
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }
  
  return track[str2.length][str1.length];
}

/**
 * Perform fuzzy match between query and target string
 * @returns true if the strings are similar enough
 */
export function fuzzyMatch(query: string, target: string, threshold = 0.7): boolean {
  if (!query || !target) return false;
  
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (targetLower.includes(queryLower)) return true;
  
  // Check if any word in the target starts with the query
  const targetWords = targetLower.split(' ');
  if (targetWords.some(word => word.startsWith(queryLower))) return true;
  
  // Compute Levenshtein distance for fuzzy matching
  const maxLength = Math.max(queryLower.length, targetLower.length);
  if (maxLength === 0) return false;
  
  const distance = levenshteinDistance(queryLower, targetLower);
  const similarity = 1 - distance / maxLength;
  
  return similarity >= threshold;
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
    
    // Exact matches first
    if (aName === queryLower && bName !== queryLower) return -1;
    if (bName === queryLower && aName !== queryLower) return 1;
    
    // Then starts with matches
    if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
    if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
    
    // Then contains matches
    if (aName.includes(queryLower) && !bName.includes(queryLower)) return -1;
    if (bName.includes(queryLower) && !aName.includes(queryLower)) return 1;
    
    // Finally, sort alphabetically
    return aName.localeCompare(bName);
  });
}

/**
 * Apply fuzzy filtering to suggestions based on query
 */
export function applyFuzzyFiltering(
  suggestions: MedicationSuggestion[],
  query: string,
  threshold = 0.7
): MedicationSuggestion[] {
  if (!query || query.trim().length < 2) return suggestions;
  
  return suggestions.filter(suggestion => 
    fuzzyMatch(query, suggestion.name, threshold)
  );
}
