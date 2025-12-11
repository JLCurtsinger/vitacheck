
/**
 * SUPP.AI API Integration Module
 * Handles interactions with the SUPP.AI API for supplement interaction checking.
 */

import { supabase } from '@/integrations/supabase/client';

export interface SuppAiInteraction {
  drug1: string;
  drug2: string;
  evidence_count: number;
  label: string;
}

export interface SuppAiResponse {
  interactions?: SuppAiInteraction[];
}

const SUPPAI_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Invokes the SUPP.AI Supabase Edge Function with a timeout wrapper.
 * Prevents infinite hangs if the function is unreachable.
 */
async function invokeSuppAiWithTimeout(query: string): Promise<any> {
  const operation = `SUPPAI lookup for "${query}"`;
  console.log(`⏱️ [SUPPAI Client] Starting ${operation} with ${SUPPAI_TIMEOUT_MS}ms timeout`);

  const invokePromise = supabase.functions.invoke('suppai', {
    body: { query },
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${operation} timed out after ${SUPPAI_TIMEOUT_MS}ms`));
    }, SUPPAI_TIMEOUT_MS);
  });

  const result = await Promise.race([invokePromise, timeoutPromise]) as {
    data: any;
    error: any;
  };

  console.log(`[SUPPAI Client] Invoke completed for "${query}"`, { hasData: !!result.data, hasError: !!result.error });

  if (result.error) {
    throw result.error;
  }

  return result.data;
}

/**
 * Fetches supplement interactions from the SUPP.AI API.
 * @param medication - The name of the medication/supplement to check
 * @returns Array of interaction data or empty array if none found
 * 
 * IMPORTANT: This function will never block the interaction pipeline.
 * If SUPP.AI is unreachable or times out, it returns an empty array.
 */
export async function getSupplementInteractions(medication: string): Promise<SuppAiInteraction[]> {
  const trimmed = medication.trim();
  if (!trimmed) {
    return [];
  }

  try {
    console.log(`🔍 [SUPPAI Client] Fetching interactions for: ${trimmed}`);
    const data = await invokeSuppAiWithTimeout(trimmed);

    const interactions = Array.isArray(data?.interactions) ? data.interactions : [];
    console.log(`✅ [SUPPAI Client] Received ${interactions.length} interactions for ${trimmed}`);

    return interactions;
  } catch (error: any) {
    console.error(`❌ [SUPPAI Client] Failed to fetch interactions for ${trimmed}:`, {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    // IMPORTANT: never block the interaction pipeline
    return [];
  }
}
