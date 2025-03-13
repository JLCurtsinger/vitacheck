
/**
 * Adverse Events Processing Utilities
 * 
 * This module handles processing of FDA adverse events data for medication interactions.
 */

import { InteractionSource, AdverseEventData } from '../types';
import { Severity } from './severity-processor';

/**
 * Creates a source entry for adverse events
 */
export function processAdverseEventsSource(adverseEventsResult: AdverseEventData): InteractionSource | null {
  if (!adverseEventsResult || adverseEventsResult.eventCount === 0) {
    return null;
  }

  // Determine severity based on the number and seriousness of reports
  const adverseEventSeverity: Severity = 
    adverseEventsResult.seriousCount > 0 ? "severe" : 
    adverseEventsResult.eventCount > 5 ? "minor" : "unknown";
  
  // Create a description for the adverse events
  const reactionsList = adverseEventsResult.commonReactions.length > 0 
    ? `. Common reported reactions include: ${adverseEventsResult.commonReactions.join(', ')}.`
    : '';
  
  const severityText = adverseEventsResult.seriousCount > 0 
    ? 'serious' 
    : 'potential';
  
  const description = `Real-world data shows ${adverseEventsResult.eventCount} reported ${severityText} adverse events for this combination${reactionsList} Consult a healthcare provider before combining.`;
  
  return {
    name: "FDA Adverse Events",
    severity: adverseEventSeverity,
    description
  };
}
