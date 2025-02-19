
/**
 * RxNorm API Integration Module
 * Handles interactions with the RxNorm API for medication lookups and interaction checking.
 */

import { createClient } from '@supabase/supabase-js';

interface RxNormResponse {
  idGroup?: {
    rxnormId?: string[];
  };
}

interface RxNormInteractionResponse {
  fullInteractionTypeGroup?: Array<{
    fullInteractionType: Array<{
      interactionPair: Array<{
        description: string;
        severity?: string;
      }>;
    }>;
  }>;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

// Ensure we have the required environment variables
const supabaseUrl = 'https://kqbytrxntxdelgltcmqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnl0cnhudHhkZWxnbHRjbXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDI3NjAsImV4cCI6MjA1MTg3ODc2MH0.7F2ANCrynm8nasGIfQ16dNNJic7rbZaFXHWO9L_eCwQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Retrieves the RxCUI (RxNorm Concept Unique Identifier) for a given medication name.
 * @param medication - The name of the medication to look up
 * @returns The RxCUI if found, null otherwise
 */
export async function getRxCUI(medication: string): Promise<string | null> {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      const { data, error } = await supabase.functions.invoke('rxnorm', {
        body: { 
          operation: 'rxcui',
          name: medication.trim()
        }
      });
      
      if (error) {
        console.error(`RxNorm API error:`, error);
        throw error;
      }
      
      return data?.idGroup?.rxnormId?.[0] || null;
      
    } catch (error) {
      attempts++;
      console.error(`RxNorm lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('All RxNorm lookup attempts failed for medication:', medication);
      return null;
    }
  }
  
  return null;
}

/**
 * Fetches drug interaction information for a given RxCUI.
 * @param rxCUI - The RxNorm Concept Unique Identifier
 * @returns Array of interaction data or empty array if none found
 */
export async function getDrugInteractions(rxCUI: string) {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      const { data, error } = await supabase.functions.invoke('rxnorm', {
        body: {
          operation: 'interactions',
          rxcui: rxCUI
        }
      });
      
      if (error) {
        console.error(`Drug interactions API error:`, error);
        throw error;
      }
      
      return data?.fullInteractionTypeGroup || [];
      
    } catch (error) {
      attempts++;
      console.error(`Drug interactions lookup attempt ${attempts} failed:`, error);
      
      if (attempts < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }
      
      console.error('All drug interactions lookup attempts failed for RxCUI:', rxCUI);
      return [];
    }
  }
  
  return [];
}
