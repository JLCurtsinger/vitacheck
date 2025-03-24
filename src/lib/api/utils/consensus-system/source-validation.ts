
/**
 * Source Validation
 * 
 * This module handles validation of interaction sources to determine if they
 * contain meaningful evidence about a medication interaction.
 */

import { InteractionSource } from '../../types';

/**
 * Determines if a source contains meaningful interaction evidence
 * and should be included in confidence calculations
 */
export function hasValidInteractionEvidence(source: InteractionSource): boolean {
  // Sources with no descriptions or "no data available" aren't valid
  if (!source.description || 
      source.name === 'No Data Available' || 
      source.severity === 'unknown') {
    return false;
  }
  
  // "No known interaction" responses should not affect confidence
  const noInteractionPhrases = [
    'no known interaction',
    'no interactions found',
    'no interaction data',
    'no evidence of interaction',
    'could not find any interaction'
  ];
  
  if (noInteractionPhrases.some(phrase => 
      source.description.toLowerCase().includes(phrase))) {
    return false;
  }
  
  // If source explicitly indicates safety without evidence, don't count it
  if (source.severity === 'safe' && 
      !source.description.toLowerCase().includes('evidence') &&
      !source.description.toLowerCase().includes('study')) {
    return false;
  }
  
  // Always include sources with actual adverse event data
  if (source.eventData && source.eventData.totalEvents > 0) {
    return true;
  }
  
  // Always include high-quality sources that identify specific interactions
  const interactionEvidencePhrases = [
    'adverse event',
    'clinical',
    'case report',
    'study found',
    'research shows',
    'trial',
    'evidence indicates',
    'reported',
    'interaction risk',
    'contraindicated',
    'statistical',
    'increased risk',
    'observed'
  ];
  
  // Check if description contains evidence of actual interaction data
  return interactionEvidencePhrases.some(phrase => 
    source.description.toLowerCase().includes(phrase));
}
