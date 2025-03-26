
/**
 * Source Weight Determination
 * 
 * This module calculates the weight to assign to various data sources
 * based on their reliability and evidence quality.
 */

import { InteractionSource } from '../../types';

/**
 * Determines the weight to give a particular source in the consensus calculation
 * 
 * @param source The interaction source to analyze
 * @returns A weight between 0 and 1
 */
export function determineSourceWeight(source: InteractionSource): number {
  // Guard against null or undefined source
  if (!source || !source.name) {
    return 0;
  }
  
  // Start with a baseline weight based on source reliability
  let weight = getBaseSourceWeight(source.name);
  
  // If confidence is explicitly provided, use it to influence the weight
  if (source.confidence !== undefined && source.confidence !== null) {
    // Scale the provided confidence (typically 0-100) to a 0-1 range
    const confidenceFactor = Math.max(0, Math.min(source.confidence, 100)) / 100;
    
    // Blend the base weight with the confidence factor
    weight = (weight * 0.7) + (confidenceFactor * 0.3);
  }
  
  // Adjust weight based on severity - give more weight to more severe ratings
  // as they're more important for safety
  if (source.severity === "severe") {
    weight *= 1.2; // 20% boost for severe warnings
  } else if (source.severity === "moderate") {
    weight *= 1.1; // 10% boost for moderate warnings
  }
  
  // Event data provides real-world evidence, so it gets a boost
  if (source.eventData && source.eventData.totalEvents > 0) {
    // More events = more reliable data
    const eventCount = source.eventData.totalEvents;
    let eventFactor = 0;
    
    if (eventCount > 1000) {
      eventFactor = 0.2; // Large dataset
    } else if (eventCount > 100) {
      eventFactor = 0.15; // Moderate dataset
    } else if (eventCount > 10) {
      eventFactor = 0.1; // Small but meaningful dataset
    } else {
      eventFactor = 0.05; // Very small dataset
    }
    
    weight += eventFactor;
  }
  
  // Cap the weight at 1.0
  return Math.min(weight, 1.0);
}

/**
 * Gets the base reliability weight for a source based on its name
 */
function getBaseSourceWeight(sourceName: string): number {
  // Convert to lowercase for case-insensitive comparison
  const name = sourceName.toLowerCase();
  
  // FDA and RxNorm are the most reliable
  if (name.includes('rxnorm')) {
    return 0.9; // RxNorm is highly reliable for approved drug interactions
  } else if (name.includes('fda') && !name.includes('adverse')) {
    return 0.85; // FDA warnings are also very reliable
  } else if (name.includes('adverse events') || name.includes('openfda')) {
    return 0.8; // OpenFDA adverse events represent real-world data
  } else if (name.includes('supp.ai')) {
    return 0.7; // SUPP.AI uses NLP on literature, so medium reliability
  } else if (name.includes('ai literature')) {
    return 0.65; // Our AI analysis of literature
  } else if (name.includes('mechanism')) {
    return 0.7; // Mechanistic analysis has medium reliability
  } else {
    return 0.5; // Default weight for unknown sources
  }
}
