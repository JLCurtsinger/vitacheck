
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
  
  // Sort sources by name for deterministic processing order
  const sortedSources = [...sources].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  
  // Filter sources to only include those with valid interaction evidence
  const validSources = sortedSources.filter(source => {
    // Safely check if source exists and has valid properties
    if (!source) return false;
    return hasValidInteractionEvidence(source);
  });
  
  // If we have no valid sources, but have some sources, use all sources
  // This prevents completely blank results when only general information is available
  const sourcesToProcess = validSources.length > 0 ? validSources : sortedSources;
  
  // Process each source in deterministic order and collect their weights
  const sourceWeights: { source: InteractionSource, weight: number }[] = [];
  
  sourcesToProcess.forEach(source => {
    // Skip invalid sources
    if (!source || !source.name) return;
    
    // Get the dynamic weight for this source based on evidence quality
    const weight = determineSourceWeight(source);
    
    // Only include sources with positive weight
    if (weight <= 0) return;
    
    sourceWeights.push({ source, weight });
    
    // Check if this is AI validation
    if (source.name === 'AI Literature Analysis') {
      aiValidated = true;
    }
  });

  // Calculate total weight from all valid sources
  const totalWeight = sourceWeights.reduce((sum, item) => sum + item.weight, 0);
  
  return { sourceWeights, aiValidated, totalWeight };
}
