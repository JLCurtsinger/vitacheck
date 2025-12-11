
import { MedicationSuggestion } from "../types";
import { getCachedSuggestions, cacheSuggestions } from "../cache";
import { fuzzyMatch } from "../utils";
import { getSupplementInteractions } from "@/lib/api/suppai";

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
    
    // Use the timeout-protected getSupplementInteractions function
    // This ensures we never hang if SUPP.AI is unreachable
    const interactions = await getSupplementInteractions(query.trim());
    
    if (!interactions || interactions.length === 0) {
      return [];
    }
    
    // Extract supplement names from interactions data
    const supplements = new Set<string>();
    
    interactions.forEach((interaction) => {
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
