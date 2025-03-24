
/**
 * Source Weight
 * 
 * This module determines the weight to assign to each source in the consensus system
 * based on quality of evidence.
 */

import { InteractionSource } from '../../types';

/**
 * Determines the weight to assign to a source based on evidence quality
 */
export function determineSourceWeight(source: InteractionSource): number {
  if (!source || !source.description || source.name === 'No Data Available') {
    return 0;
  }
  
  // Don't include unknown severity sources by default, but there are exceptions below
  if (source.severity === 'unknown' && !source.description) {
    return 0;
  }
  
  const desc = source.description.toLowerCase();
  
  // Special cases for different sources
  
  // OpenFDA Adverse Events: highest weight for real-world data
  if (source.name === 'OpenFDA Adverse Events' || source.name.includes('Adverse Event')) {
    // Only count if it has event data with actual events
    return source.eventData?.totalEvents > 0 ? 0.95 : 0;
  }
  
  // AI Literature Analysis: weight depends on evidence quality
  if (source.name === 'AI Literature Analysis') {
    // Higher weight if contains references to studies or research
    return /study|research|evidence|trial/.test(desc) ? 0.6 : 0.45;
  }
  
  // FDA: high weight for black box warnings
  if (source.name === 'FDA' && desc.includes('warning')) {
    return 0.8;
  }
  
  // Other sources: weight depends on evidence quality
  
  // High evidence phrases indicate stronger evidence
  const highEvidencePhrases = [
    'adverse event', 'case report', 'study found', 'research shows',
    'clinical trial', 'reported', 'contraindicated', 'observed', 'bleeding risk',
    'mortality', 'fatality', 'death', 'hospitalizations',
    'toxicity', 'overdose', 'hazardous'
  ];
  
  // Low evidence phrases indicate weaker evidence
  const lowEvidencePhrases = [
    'monitor', 'may cause', 'use caution',
    'general information', 'labeling only', 'possible'
  ];
  
  // No interaction phrases should have minimal impact on consensus
  const noInteractionPhrases = [
    'no interaction', 'no known', 'no evidence of',
    'has not been established', 'no data available'
  ];
  
  // Check evidence quality
  if (highEvidencePhrases.some(phrase => desc.includes(phrase))) {
    return 0.7;
  } else if (noInteractionPhrases.some(phrase => desc.includes(phrase))) {
    // For safety ratings, no interaction is a positive finding
    if (source.severity === 'safe') {
      return 0.5;  // Some weight for confirmed safety
    }
    return 0.2;  // Very low weight for no data
  } else if (lowEvidencePhrases.some(phrase => desc.includes(phrase))) {
    return 0.4;
  }
  
  // Default weight for sources without special categorization
  return 0.5;
}
