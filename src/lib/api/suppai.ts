
/**
 * SUPP.AI API Integration Module
 * Handles interactions with the SUPP.AI API for supplement interaction checking.
 */

import { supabase } from '@/integrations/supabase/client';

export interface SuppAiResponse {
  interactions?: Array<{
    drug1: string;
    drug2: string;
    evidence_count: number;
    label: string;
  }>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

/**
 * Fetches supplement interactions from the SUPP.AI API.
 * @param medication - The name of the medication/supplement to check
 * @returns Array of interaction data or empty array if none found
 */
export async function getSupplementInteractions(medication: string) {
  let attempts = 0;
  
  console.log(`🔍 [SUPPAI Client] Fetching interactions for: ${medication}`);
  
  while (attempts < MAX_RETRIES) {
    try {
      const { data, error } = await supabase.functions.invoke('suppai', {
        body: { query: medication.trim() }
      });
      
      if (error) {
        console.error(`❌ [SUPPAI Client] API error:`, error);
        throw error;
      }
      
      console.log(`✅ [SUPPAI Client] Received data for ${medication}:`, 
        data?.interactions ? `Found ${data.interactions.length} interactions` : 'No interactions found');
      console.log(`⚙️ [SUPPAI Client] Raw response:`, data);
      
      return data?.interactions || [];
      
    } catch (error) {
      attempts++;
      console.error(`❌ [SUPPAI Client] Lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('❌ [SUPPAI Client] All lookup attempts failed for medication:', medication);
      return [];
    }
  }
  
  return [];
}
