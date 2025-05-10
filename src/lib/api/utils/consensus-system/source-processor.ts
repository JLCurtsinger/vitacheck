
/**
 * Source Processor for Consensus System
 * 
 * Processes sources and assigns appropriate weights based on source reliability.
 * Enhanced to ensure AI sources have appropriate weightings and don't override
 * medical database sources.
 */

import { InteractionSource } from '../../types';

/**
 * Processes sources and assigns weights based on source type and confidence
 */
export function processSourcesWithWeights(sources: InteractionSource[]) {
  const isDebug = process.env.DEBUG === 'true';
  if (isDebug) {
    console.log(`[Source Processor] Processing ${sources.length} sources for weighting`);
  }
  
  // Track whether we have AI validation
  let aiValidated = false;
  
  // Define source weights (higher = more reliable)
  const sourceWeights = sources.map(source => {
    // Default weight
    let weight = 0.5;
    
    // Weight adjustment based on source type
    switch (source.name) {
      case "FDA":
        weight = 1.0; // Maximum weight for FDA
        break;
      case "RxNorm":
        weight = 0.9; // Very high weight for RxNorm
        break;
      case "OpenFDA Adverse Events":
        // Weight based on event data if available
        if (source.eventData && source.eventData.totalEvents > 0) {
          const eventCount = source.eventData.totalEvents;
          weight = Math.min(1.0, 0.7 + (eventCount > 1000 ? 0.3 : eventCount / 3000));
        } else {
          weight = 0.8; // Default weight for OpenFDA without specific event data
        }
        break;
      case "SUPP.AI":
        weight = 0.7; // Moderate-high weight for SUPP.AI
        break;
      case "AI Literature Analysis":
        // RULE 2: Limit AI Literature Analysis weight to prevent it from becoming dominant
        weight = 0.4; // Lower weight to ensure AI doesn't override medical database sources
        aiValidated = true; // Mark that we have AI validation
        break;
      case "No Data Available":
        weight = 0.1; // Very low weight for fallback sources
        break;
      default:
        weight = 0.5; // Moderate weight for unrecognized sources
    }
    
    // Adjust weight based on source confidence if available
    if (source.confidence !== undefined) {
      // Apply a multiplier based on confidence percentage (0.5-1.5 range)
      const confidenceMultiplier = 0.5 + (source.confidence / 100);
      weight = Math.min(1.0, weight * confidenceMultiplier);
    }
    
    // Adjust weight based on severity for consistency and safety
    // This helps ensure severe warnings get appropriate attention
    if (source.severity === "severe" && source.name !== "AI Literature Analysis") {
      weight *= 1.2; // Slight boost for severe warnings from non-AI sources
    } else if (source.severity === "unknown") {
      weight *= 0.7; // Reduce weight for unknown severity
    }
    
    // Cap the maximum weight at 1.0
    weight = Math.min(1.0, weight);
    
    if (isDebug && weight > 0.3) {
      console.log(`[Source Processor] ${source.name} (${source.severity}): weight=${weight.toFixed(2)}`);
    }
    
    return { source, weight };
  });
  
  // Calculate total weight for normalization
  const totalWeight = sourceWeights.reduce((sum, { weight }) => sum + weight, 0);
  
  if (isDebug) {
    console.log(`[Source Processor] Total weight: ${totalWeight.toFixed(2)}, AI validated: ${aiValidated}`);
  }
  
  return { sourceWeights, aiValidated, totalWeight };
}
