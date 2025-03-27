
/**
 * Adverse Event Processor
 * 
 * This module handles adverse event data processing for consensus calculation.
 */

import { AdverseEventData } from '../../types';

// Threshold for considering a severe adverse event rate significant
export const SEVERE_EVENT_THRESHOLD = 0.05; // 5% of total events

/**
 * Processes adverse events data and returns weight and severity information
 */
export function processAdverseEvents(
  adverseEvents: AdverseEventData | null | undefined
): {
  weight: number;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  count: number;
} | null {
  if (!adverseEvents || adverseEvents.eventCount === 0) {
    return null;
  }
  
  const adverseEventWeight = 0.95; // High confidence for real-world data
  
  // Calculate percentage of serious events
  const seriousPercentage = adverseEvents.seriousCount / adverseEvents.eventCount;
  
  let severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  
  if (seriousPercentage >= SEVERE_EVENT_THRESHOLD) {
    // Significant serious events -> severe
    severity = "severe";
  } else if (adverseEvents.seriousCount > 0) {
    // Some serious events but below threshold -> moderate
    severity = "moderate";
  } else if (adverseEvents.eventCount > 10) {
    // Many non-serious events -> minor
    severity = "minor";
  } else {
    // Few non-serious events -> considered safe
    severity = "safe";
  }
  
  return {
    weight: adverseEventWeight,
    severity,
    count: 1
  };
}
