
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
  
  // OpenFDA Adverse Events: highest weight based on relevance and seriousness percentage
  if (source.name === 'OpenFDA Adverse Events' || source.name.includes('Adverse Event')) {
    // Only count if it has event data with actual events
    if (!source.eventData?.totalEvents || source.eventData.totalEvents <= 0) {
      return 0;
    }
    
    // Calculate weight based on serious percentage
    const seriousPercentage = source.eventData.seriousPercentage || 
      (source.eventData.seriousEvents / source.eventData.totalEvents);
    
    // Apply weighted scale based on seriousness
    if (seriousPercentage >= 0.01) { // ≥ 1%
      return 0.95;
    } else if (seriousPercentage >= 0.005) { // 0.5-0.99%
      return 0.8;
    } else if (seriousPercentage >= 0.001) { // 0.1-0.49%
      return 0.6;
    } else { // < 0.1%
      return 0.5;
    }
  }
  
  // AI Literature Analysis: weight depends on evidence quality
  if (source.name === 'AI Literature Analysis') {
    // Higher weight if describes specific interaction mechanism
    if (/interaction (mechanism|between)|directly (interacts|affects)/.test(desc)) {
      return 0.6;
    }
    // Moderate weight if contains references to studies but less specific
    else if (/study|research|evidence|trial/.test(desc)) {
      return 0.5;
    }
    // Lower weight for general correlations
    else if (/correlation|association|linked|may interact/.test(desc)) {
      return 0.4;
    }
    // Very low weight if no clear evidence
    return 0.3;
  }
  
  // FDA: weight based on specificity of warnings
  if (source.name === 'FDA') {
    // High weight for specific warnings mentioning both medications
    if (/contraindicated|serious|fatal|death|avoid combining|do not use/.test(desc) || 
        (desc.includes('warning') && desc.includes('both'))) {
      return 0.6;
    }
    // Moderate weight for general warnings on one substance
    else if (desc.includes('warning') || /caution|adverse|risk/.test(desc)) {
      return 0.4;
    }
    // If no specific warnings or just labeling info
    return 0.2;
  }
  
  // SUPP.AI & RxNorm: weight based on specificity
  if (source.name === 'SUPP.AI' || source.name === 'RxNorm') {
    // Look for specific interaction mentions
    if (/specific interaction|directly (interacts|affects)|confirmed|verified/.test(desc)) {
      return 0.6;
    }
    // Moderate weight for general mentions
    else if (/potential|possible|may|could|suggest/.test(desc)) {
      return 0.4;
    }
    // Lower weight for less specific mentions
    return 0.3;
  }
  
  // Evidence quality indicators for other sources
  
  // High evidence phrases indicate stronger evidence
  const highEvidencePhrases = [
    'adverse event', 'case report', 'study found', 'research shows',
    'clinical trial', 'reported', 'contraindicated', 'observed', 'bleeding risk',
    'mortality', 'fatality', 'death', 'hospitalizations',
    'toxicity', 'overdose', 'hazardous'
  ];
  
  // Medium evidence phrases
  const mediumEvidencePhrases = [
    'interaction', 'effect', 'impact', 'influence', 'change', 
    'alter', 'modify', 'adjust', 'increase', 'decrease'
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
    return 0.6;
  } else if (mediumEvidencePhrases.some(phrase => desc.includes(phrase))) {
    return 0.5;
  } else if (lowEvidencePhrases.some(phrase => desc.includes(phrase))) {
    return 0.4;
  } else if (noInteractionPhrases.some(phrase => desc.includes(phrase))) {
    // For safety ratings, no interaction is a positive finding
    if (source.severity === 'safe') {
      return 0.3;  // Some weight for confirmed safety
    }
    return 0;  // No weight for no data
  }
  
  // Default weight for sources without special categorization
  return 0.3;
}
