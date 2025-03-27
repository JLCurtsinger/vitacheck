
/**
 * Source Processor
 * 
 * This module handles the processing of interaction sources for consensus calculation.
 */

import { InteractionSource } from '../../types';
import { determineSourceWeight } from './source-weight';
import { hasValidInteractionEvidence } from './source-validation';

/**
 * Processes sources and returns valid sources with their weights
 */
export function processSourcesWithWeights(
  sources: InteractionSource[]
): { 
  sourceWeights: { source: InteractionSource, weight: number }[]; 
  aiValidated: boolean;
  totalWeight: number;
} {
  let aiValidated = false;
  
  // Log initial sources for diagnostics
  console.log(`[Source Processor] Processing ${sources.length} sources`);
  sources.forEach((source, index) => {
    if (source) {
      console.log(`[Source Processor] Source #${index}: "${source.name || 'Unnamed'}" - "${source.severity || 'unknown'}" severity, confidence: ${source.confidence || 'N/A'}`);
    } else {
      console.log(`[Source Processor] Source #${index}: Invalid/null source`);
    }
  });
  
  // Sort sources by name for deterministic processing order
  const sortedSources = [...sources].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
  console.log('[Source Processor] Sorted sources by name for deterministic processing');
  
  // Filter sources to only include those with valid interaction evidence
  const validSources = sortedSources.filter(source => {
    // Safely check if source exists and has valid properties
    if (!source) {
      console.log('[Source Processor] Skipping null/undefined source');
      return false;
    }
    
    const isValid = hasValidInteractionEvidence(source);
    console.log(`[Source Processor] Source "${source.name || 'Unnamed'}" validation: ${isValid ? 'Valid' : 'Invalid'}`);
    return isValid;
  });
  
  console.log(`[Source Processor] Found ${validSources.length} valid sources out of ${sortedSources.length} total sources`);
  
  // If we have no valid sources, but have some sources, use all sources
  // This prevents completely blank results when only general information is available
  const sourcesToProcess = validSources.length > 0 ? validSources : sortedSources;
  console.log(`[Source Processor] Using ${sourcesToProcess.length} sources for processing`);
  
  // Process each source in deterministic order and collect their weights
  const sourceWeights: { source: InteractionSource, weight: number }[] = [];
  
  sourcesToProcess.forEach(source => {
    // Skip invalid sources
    if (!source || !source.name) {
      console.log('[Source Processor] Skipping source without name');
      return;
    }
    
    // Get the dynamic weight for this source based on evidence quality
    const weight = determineSourceWeight(source);
    console.log(`[Source Processor] Source "${source.name}" assigned weight: ${weight}`);
    
    // Only include sources with positive weight
    if (weight <= 0) {
      console.log(`[Source Processor] Excluding source "${source.name}" due to zero/negative weight`);
      return;
    }
    
    sourceWeights.push({ source, weight });
    
    // Check if this is AI validation
    if (source.name === 'AI Literature Analysis') {
      aiValidated = true;
      console.log('[Source Processor] Detected AI validation source');
    }
  });

  // Calculate total weight from all valid sources
  const totalWeight = sourceWeights.reduce((sum, item) => sum + item.weight, 0);
  console.log(`[Source Processor] Total combined weight: ${totalWeight} from ${sourceWeights.length} weighted sources`);
  
  return { sourceWeights, aiValidated, totalWeight };
}
