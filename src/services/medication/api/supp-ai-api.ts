
import { MedicationSuggestion } from "../types";
import { getCachedSuggestions, cacheSuggestions } from "../cache";
import { fuzzyMatch } from "../utils";

/**
 * Lazy-load Supabase client to avoid blocking module initialization
 */
async function getSupabaseClient() {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    return supabase;
  } catch (err) {
    console.error('❌ SUPP.AI: Failed to import Supabase client', err);
    throw err;
  }
}

/**
 * Fetch supplement suggestions from SUPP.AI API
 */
export async function fetchSuppAiSuggestions(query: string): Promise<MedicationSuggestion[]> {
  try {
    // Skip API call for very short queries
    if (query.length < 2) return [];

    // Check cache first
    const cachedResults = getCachedSuggestions("suppai", query);
    if (cachedResults) {
      return cachedResults;
    }

    console.log('🔍 Fetching SUPP.AI suggestions for:', query);
    
    // Lazy-load Supabase client to avoid blocking if env vars are missing
    let supabase;
    try {
      supabase = await getSupabaseClient();
      console.log('✅ SUPP.AI: Supabase client loaded');
    } catch (err) {
      console.error('❌ SUPP.AI: Failed to load Supabase client', err);
      return [];
    }
    
    console.log('📡 SUPP.AI: about to invoke function', { functionName: 'suppai', query: query.trim() });
    
    let data, error;
    try {
      const result = await supabase.functions.invoke('suppai', {
        body: { query: query.trim() }
      });
      data = result.data;
      error = result.error;
      console.log('✅ SUPP.AI: function invoke completed', { hasData: !!data, hasError: !!error });
    } catch (err) {
      console.error('❌ SUPP.AI: function invoke error', err);
      return [];
    }
    
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
    cacheSuggestions("suppai", query, suggestions);
    
    return suggestions;
  } catch (error) {
    console.error('Error fetching SUPP.AI suggestions:', error);
    return [];
  }
}
