
import { MedicationSuggestion } from "../types";
import { getCachedSuggestions, cacheSuggestions } from "../cache";
import { fuzzyMatch } from "../utils";
import { supabase } from "@/integrations/supabase/client";
import { SuppAiInteraction } from "@/lib/api/suppai";

// Shorter timeout for autocomplete suggestions (non-blocking)
const SUGGESTION_TIMEOUT_MS = 2500; // 2.5 seconds

/**
 * Lightweight SUPP.AI invocation with short timeout for autocomplete suggestions
 */
async function getSuppAiSuggestionsWithTimeout(query: string): Promise<SuppAiInteraction[]> {
  const operation = `SUPPAI suggestion lookup for "${query}"`;
  console.log(`⏱️ [SUPPAI Suggestions] Starting ${operation} with ${SUGGESTION_TIMEOUT_MS}ms timeout`);

  const invokePromise = supabase.functions.invoke('suppai', {
    body: { query },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${SUGGESTION_TIMEOUT_MS}ms`));
    }, SUGGESTION_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([invokePromise, timeoutPromise]) as {
      data: any;
      error: any;
    };

    if (result.error) {
      throw result.error;
    }

    const interactions = Array.isArray(result.data?.data?.interactions) 
      ? result.data.data.interactions 
      : Array.isArray(result.data?.interactions)
      ? result.data.interactions
      : [];

    console.log(`✅ [SUPPAI Suggestions] Received ${interactions.length} interactions for ${query}`);
    return interactions;
  } catch (error: any) {
    if (error?.message?.includes('timed out')) {
      console.warn(`⏱️ [SUPPAI Suggestions] Timeout for "${query}" - returning empty results`);
    } else {
      console.warn(`⚠️ [SUPPAI Suggestions] Error for "${query}":`, error?.message || error);
    }
    return [];
  }
}

/**
 * Fetch supplement suggestions from SUPP.AI API
 * Uses a shorter timeout (2.5s) to ensure non-blocking behavior for autocomplete
 * 
 * NOTE: This function is currently not used by the autocomplete pipeline.
 * SUPP.AI is disabled for typeahead suggestions to avoid slow, low-yield calls,
 * but this helper is kept for potential future use.
 */
export async function fetchSuppAiSuggestions(query: string): Promise<MedicationSuggestion[]> {
  try {
    // Skip API call for very short queries
    if (query.length < 3) return [];

    // Check cache first
    const cachedResults = getCachedSuggestions("suppai", query);
    if (cachedResults) {
      return cachedResults;
    }

    console.log('🔍 Fetching SUPP.AI suggestions for:', query);
    
    // Use the lightweight timeout-protected function for suggestions
    const interactions = await getSuppAiSuggestionsWithTimeout(query.trim());
    
    if (!interactions || interactions.length === 0) {
      return [];
    }
    
    // Extract supplement names from interactions data
    const supplements = new Set<string>();
    const queryLower = query.toLowerCase();
    
    interactions.forEach((interaction) => {
      if (interaction.drug1 && interaction.drug1.toLowerCase().includes(queryLower)) {
        supplements.add(interaction.drug1);
      }
      if (interaction.drug2 && interaction.drug2.toLowerCase().includes(queryLower)) {
        supplements.add(interaction.drug2);
      }
    });
    
    const suggestions = Array.from(supplements).slice(0, 8).map(name => ({
      name,
      source: 'SUPP.AI'
    }));
    
    // Cache the results
    cacheSuggestions("suppai", query, suggestions);
    
    return suggestions;
  } catch (error) {
    console.warn('⚠️ Error fetching SUPP.AI suggestions (non-blocking):', error);
    return [];
  }
}
