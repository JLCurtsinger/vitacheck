
/**
 * Adverse Events Data Processor
 * 
 * This module handles processing adverse event data from OpenFDA
 * into a format that can be used for interaction checking.
 */

import { AdverseEventData, InteractionSource } from '../types';

/**
 * Processes adverse event data into a source object for interactions
 * 
 * @param adverseEvents - Adverse event data from OpenFDA
 * @returns InteractionSource object or null if no data
 */
export function processAdverseEventsSource(
  adverseEvents: AdverseEventData | null
): InteractionSource | null {
  if (!adverseEvents || adverseEvents.eventCount === 0) {
    return null;
  }
  
  // Calculate the percentage of serious events
  const seriousPercentage = adverseEvents.seriousCount / adverseEvents.eventCount;
  let severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  let confidence = 75; // Base confidence for adverse event data
  
  // Determine the severity based on data
  if (seriousPercentage >= 0.05 && adverseEvents.seriousCount > 5) {
    // More than 5% serious events and at least 5 serious cases
    severity = "severe";
    confidence = 85;
  } else if (adverseEvents.seriousCount > 0) {
    // At least one serious event but below threshold
    severity = "moderate";
    confidence = 80;
  } else if (adverseEvents.eventCount > 10) {
    // Many non-serious events
    severity = "minor";
    confidence = 75;
  } else {
    // Few non-serious events
    severity = "minor";
    confidence = 65;
  }
  
  // Format the description based on the data
  let description = `${adverseEvents.eventCount} adverse events reported (`;
  
  if (adverseEvents.seriousCount > 0) {
    description += `including ${adverseEvents.seriousCount} serious cases, `;
  }
  
  description += `${Math.round(seriousPercentage * 100)}% serious). `;
  
  if (adverseEvents.commonReactions && adverseEvents.commonReactions.length > 0) {
    description += `Common reactions include: ${adverseEvents.commonReactions.slice(0, 3).join(', ')}.`;
  }
  
  return {
    name: "OpenFDA Adverse Events",
    severity,
    description,
    confidence,
    // Add detailed event counts for the breakdown table
    eventData: {
      totalEvents: adverseEvents.eventCount,
      seriousEvents: adverseEvents.seriousCount,
      nonSeriousEvents: adverseEvents.eventCount - adverseEvents.seriousCount
    }
  };
}
