
/**
 * Drug Interactions Service
 * Handles fetching and processing of drug interaction data
 */

import { fetchInteractionData } from './rxnorm-client';

/**
 * Fetches drug interaction information for given RxCUIs.
 * @param rxCUIs - Array of RxNorm Concept Unique Identifiers
 * @returns Array of interaction data or empty array if none found
 */
export async function getDrugInteractions(rxCUIs: string[]): Promise<any[]> {
  console.log('🔍 [RxNorm Client] Checking interactions for RxCUIs:', rxCUIs);
  
  // Ensure rxCUIs is always an array, never a concatenated string
  const rxCUIsArray = Array.isArray(rxCUIs) ? rxCUIs : [rxCUIs];
  
  const interactionResults = await fetchInteractionData(rxCUIsArray);
  
  console.log('✅ [RxNorm Client] Processed interaction results:', 
    interactionResults.length > 0 ? `Found ${interactionResults.length} interaction groups` : 'No interactions');
  
  return interactionResults;
}
