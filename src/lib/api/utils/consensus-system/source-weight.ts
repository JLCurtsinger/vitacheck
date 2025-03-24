
/**
 * Source Weight Determination
 * 
 * This module determines the weight of each information source based on
 * the quality and relevance of its evidence.
 */

import { InteractionSource } from '../../types';

/**
 * Determines the weight of a source based on evidence quality
 */
export function determineSourceWeight(source: InteractionSource): number {
  if (!source.description || source.severity === 'unknown') return 0;

  const desc = source.description.toLowerCase();

  const highEvidencePhrases = [
    'adverse event', 'case report', 'study found', 'research shows',
    'clinical trial', 'reported', 'contraindicated', 'observed', 'bleeding risk',
    'statistical', 'increased risk', 'evidence indicates', 'trial'
  ];

  const lowEvidencePhrases = [
    'no interaction', 'no known', 'monitor', 'may cause', 'use caution',
    'general information', 'labeling only', 'could not find any interaction',
    'no interactions found', 'no interaction data', 'no evidence of interaction'
  ];

  // VitaCheck Safety Database always has high weight as it contains verified high-risk combinations
  if (source.name === 'VitaCheck Safety Database') {
    return 0.95;
  }

  // OpenFDA: only count if it has event data
  if (source.name === 'OpenFDA Adverse Events') {
    return source.eventData?.totalEvents > 0 ? 0.95 : 0;
  }

  if (source.name === 'AI Literature Analysis') {
    return /study|research|evidence|trial/.test(desc) ? 0.6 : 0.45;
  }

  // RxNorm tends to have high-quality data when it reports an interaction
  if (source.name === 'RxNorm' && source.severity !== 'unknown' && source.severity !== 'safe') {
    return highEvidencePhrases.some(p => desc.includes(p)) ? 0.85 : 0.7;
  }

  // FDA data is also quite reliable when it comes from black box warnings
  if (source.name === 'FDA' && desc.includes('box warning')) {
    return 0.85;
  }

  if (highEvidencePhrases.some(p => desc.includes(p))) return 0.7;
  if (lowEvidencePhrases.some(p => desc.includes(p))) return 0.4;

  return 0.5; // Default mid confidence if not matched
}
