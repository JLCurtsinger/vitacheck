
/**
 * Source Validation
 * 
 * Enhanced validation for interaction data sources with detailed 
 * error reporting and fallback mechanisms.
 */

import { InteractionSource } from '../../types';
import { logParsingIssue } from '../diagnostics/api-response-logger';

/**
 * Validates if a source has sufficient evidence of an interaction
 * Enhanced with detailed logging for validation failures
 */
export function hasValidInteractionEvidence(
  source: InteractionSource,
  rawData?: any
): boolean {
  try {
    // No source means no evidence
    if (!source) {
      if (rawData) {
        logParsingIssue('VALIDATION', rawData, 'Source object is null or undefined');
      }
      return false;
    }
    
    // Check for description content
    const hasDescription = source.description && 
                          typeof source.description === 'string' && 
                          source.description.length > 10;
                          
    // Check for severity rating
    const hasSeverity = source.severity && 
                       (source.severity === 'severe' || 
                        source.severity === 'moderate' || 
                        source.severity === 'minor');
    
    // Check for high confidence score
    const hasHighConfidence = typeof source.confidence === 'number' && 
                             source.confidence > 70;
    
    // Check for event data as alternative evidence
    const hasEventData = source.eventData && 
                        typeof source.eventData.totalEvents === 'number' && 
                        source.eventData.totalEvents > 0;
    
    // Either description + severity, high confidence, or event data constitutes valid evidence
    const isValid = (hasDescription && hasSeverity) || 
                    hasHighConfidence || 
                    hasEventData;
    
    // Log validation failure details for debugging
    if (!isValid && rawData) {
      const reasons = [];
      if (!hasDescription) reasons.push('Missing valid description');
      if (!hasSeverity) reasons.push('Missing valid severity');
      if (!hasHighConfidence) reasons.push('Low confidence score');
      if (!hasEventData) reasons.push('No event data');
      
      logParsingIssue(
        `VALIDATION-${source.name || 'Unknown'}`, 
        { source, rawData }, 
        `Source validation failed: ${reasons.join(', ')}`
      );
    }
    
    return isValid;
  } catch (error) {
    // Log any unexpected errors during validation
    if (rawData) {
      logParsingIssue(
        `VALIDATION-${source?.name || 'Unknown'}`, 
        { source, rawData }, 
        error instanceof Error ? error : new Error(String(error))
      );
    }
    return false;
  }
}

/**
 * Apply fallback logic when source validation fails
 * This helps recover potentially useful interaction data even when strict validation fails
 */
export function applySourceValidationFallback(
  source: InteractionSource,
  rawData: any
): InteractionSource | null {
  try {
    // If already valid, no need for fallback
    if (hasValidInteractionEvidence(source)) {
      return source;
    }
    
    // Create a copy to avoid mutating the original
    const enhancedSource: InteractionSource = { ...source };
    
    // Fallback 1: If missing severity but has description with keywords, infer severity
    if (enhancedSource.description && !enhancedSource.severity) {
      const desc = enhancedSource.description.toLowerCase();
      
      if (desc.includes('severe') || 
          desc.includes('danger') || 
          desc.includes('fatal') || 
          desc.includes('life-threatening')) {
        enhancedSource.severity = 'severe';
      } else if (desc.includes('moderate') || 
                desc.includes('significant') || 
                desc.includes('adjust') ||
                desc.includes('monitor')) {
        enhancedSource.severity = 'moderate';
      } else if (desc.includes('mild') || 
                desc.includes('minor')) {
        enhancedSource.severity = 'minor';
      }
    }
    
    // Fallback 2: If raw data contains evidence count, use as confidence proxy
    if (rawData?.evidence_count && typeof rawData.evidence_count === 'number') {
      enhancedSource.confidence = Math.min(100, Math.max(1, rawData.evidence_count * 10));
    }
    
    // Fallback 3: If raw data contains intensity, map to severity
    if (rawData?.intensity && !enhancedSource.severity) {
      const intensity = rawData.intensity.toLowerCase();
      if (intensity === 'high') enhancedSource.severity = 'severe';
      else if (intensity === 'medium') enhancedSource.severity = 'moderate';
      else if (intensity === 'low') enhancedSource.severity = 'minor';
    }
    
    // Check if fallbacks made the source valid
    if (hasValidInteractionEvidence(enhancedSource)) {
      console.log(`[Fallback] Recovered source data for ${enhancedSource.name || 'Unknown'}`);
      return enhancedSource;
    }
    
    // If we still don't have valid evidence, return null
    return null;
  } catch (error) {
    console.error('[Fallback] Error applying validation fallback:', error);
    return null;
  }
}
