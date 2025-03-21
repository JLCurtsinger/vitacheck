
import { getRxCUI } from "@/lib/api/rxnorm";
import { supabase } from "@/integrations/supabase/client";

// Types for medication suggestions
export interface MedicationSuggestion {
  name: string;
  source: string;
}

// In-memory cache for quick access to previously fetched suggestions
const suggestionCache: Record<string, MedicationSuggestion[]> = {};

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
 * Fetch medication suggestions from RxTerms API via our serverless function
 */
async function fetchRxTermsSuggestions(query: string): Promise<MedicationSuggestion[]> {
  try {
    // Skip API call for very short queries
    if (query.length < 2) return [];

    // Check cache first
    const cacheKey = `rxterms:${query.toLowerCase()}`;
    if (suggestionCache[cacheKey]) {
      console.log('📦 Using cached RxTerms results for:', query);
      return suggestionCache[cacheKey];
    }

    console.log('🔍 Fetching RxTerms suggestions for:', query);
    const response = await fetch('/.netlify/functions/rxnorm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        operation: 'suggest',
        term: query.trim()
      })
    });

    if (!response.ok) {
      console.error('❌ RxTerms API error:', response.status);
      return [];
    }

    const data = await response.json();
    const suggestions = (data?.results || [])
      .slice(0, 8)
      .map((result: any) => ({
        name: result.displayTermType === '0' ? result.displayName : `${result.displayName} (${result.rxcui})`,
        source: 'RxTerms'
      }));

    // Cache the results
    suggestionCache[cacheKey] = suggestions;
    
    return suggestions;
  } catch (error) {
    console.error('Error fetching RxTerms suggestions:', error);
    return [];
  }
}

/**
 * Fetch supplement suggestions from SUPP.AI API
 */
async function fetchSuppAiSuggestions(query: string): Promise<MedicationSuggestion[]> {
  try {
    // Skip API call for very short queries
    if (query.length < 2) return [];

    // Check cache first
    const cacheKey = `suppai:${query.toLowerCase()}`;
    if (suggestionCache[cacheKey]) {
      console.log('📦 Using cached SUPP.AI results for:', query);
      return suggestionCache[cacheKey];
    }

    console.log('🔍 Fetching SUPP.AI suggestions for:', query);
    
    const { data, error } = await supabase.functions.invoke('suppai', {
      body: { query: query.trim() }
    });
    
    if (error) {
      console.error('❌ SUPP.AI API error:', error);
      return [];
    }
    
    // Extract supplement names from interactions data
    const supplements = new Set<string>();
    
    data?.interactions?.forEach((interaction: any) => {
      if (interaction.drug1 && interaction.drug1.toLowerCase().includes(query.toLowerCase())) {
        supplements.add(interaction.drug1);
      }
      if (interaction.drug2 && interaction.drug2.toLowerCase().includes(query.toLowerCase())) {
        supplements.add(interaction.drug2);
      }
    });
    
    const suggestions = Array.from(supplements).slice(0, 8).map(name => ({
      name,
      source: 'SUPP.AI'
    }));
    
    // Cache the results
    suggestionCache[cacheKey] = suggestions;
    
    return suggestions;
  } catch (error) {
    console.error('Error fetching SUPP.AI suggestions:', error);
    return [];
  }
}

/**
 * Fetch medication suggestions from multiple sources
 */
export async function getMedicationSuggestions(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }
  
  try {
    // Attempt to fetch from local storage cache
    const cacheKey = `combined:${query.toLowerCase()}`;
    if (suggestionCache[cacheKey]) {
      return suggestionCache[cacheKey];
    }
    
    // Fetch suggestions concurrently from multiple sources
    const [rxTermsResults, suppAiResults] = await Promise.all([
      fetchRxTermsSuggestions(query),
      fetchSuppAiSuggestions(query)
    ]);
    
    // Combine and deduplicate results
    const combinedResults = [...rxTermsResults];
    
    // Add SUPP.AI results, avoiding duplicates
    suppAiResults.forEach(supp => {
      if (!combinedResults.some(item => item.name.toLowerCase() === supp.name.toLowerCase())) {
        combinedResults.push(supp);
      }
    });
    
    // Sort by relevance (exact matches first, then starts with, then includes)
    const sortedResults = combinedResults.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (aName === queryLower && bName !== queryLower) return -1;
      if (bName === queryLower && aName !== queryLower) return 1;
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
      return aName.localeCompare(bName);
    });
    
    // Cache the combined results
    suggestionCache[cacheKey] = sortedResults;
    
    return sortedResults;
  } catch (error) {
    console.error('Error fetching medication suggestions:', error);
    return [];
  }
}

/**
 * Save query to local storage history
 */
export function saveToRecentSearches(query: string): void {
  try {
    if (!query || query.trim().length < 2) return;
    
    const recentSearches = getRecentSearches();
    
    // Add to front of array and deduplicate
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item.toLowerCase() !== query.toLowerCase())
    ].slice(0, 10); // Keep only the most recent 10
    
    localStorage.setItem('vitacheck_recent_searches', JSON.stringify(updatedSearches));
  } catch (error) {
    console.error('Error saving to recent searches:', error);
  }
}

/**
 * Get recent searches from local storage
 */
export function getRecentSearches(): string[] {
  try {
    const storedSearches = localStorage.getItem('vitacheck_recent_searches');
    return storedSearches ? JSON.parse(storedSearches) : [];
  } catch (error) {
    console.error('Error retrieving recent searches:', error);
    return [];
  }
}
