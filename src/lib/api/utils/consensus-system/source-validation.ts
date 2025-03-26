
/**
 * Source Validation
 * 
 * This module provides functions to validate interaction evidence 
 * from various data sources.
 */

import { InteractionSource } from '../../types';

/**
 * Determines if a source has valid evidence of an interaction
 * 
 * @param source The interaction source to analyze
 * @returns Boolean indicating if the source provides valid evidence
 */
export function hasValidInteractionEvidence(source: InteractionSource): boolean {
  // Guard against null or undefined source
  if (!source) {
    return false;
  }
  
  // Check if the source has a name and isn't marked as "No Data Available"
  if (!source.name || source.name.includes('No Data Available')) {
    return false;
  }
  
  // Check if we have a valid severity
  if (!source.severity || source.severity === "unknown") {
    // Even with unknown severity, if we have description/evidence, it might be valid
    if (!source.description || source.description.trim() === '') {
      return false;
    }
    
    // If the description indicates "no interaction" or similar, it's not valid evidence
    const lowerDesc = source.description.toLowerCase();
    if (
      lowerDesc.includes('no interaction') || 
      lowerDesc.includes('no data') || 
      lowerDesc.includes('not found') ||
      lowerDesc.includes('unknown')
    ) {
      return false;
    }
  }
  
  // FDA adverse events data is always considered valid if it has events
  if (
    source.name.includes('Adverse Events') && 
    source.eventData && 
    source.eventData.totalEvents > 0
  ) {
    return true;
  }
  
  // For sources that explicitly indicate no interaction, return false
  if (source.severity === "safe" && !source.description) {
    return false;
  }
  
  return true;
}
