
import { InteractionSource, AdverseEventData } from '../types';

/**
 * Create a deterministic source entry from adverse events data for consistent ratings
 */
export function processAdverseEventsSource(adverseEventsData: AdverseEventData | null | undefined): InteractionSource | null {
  if (!adverseEventsData || adverseEventsData.eventCount === 0) {
    return null;
  }

  // Calculate severity based on ratio of serious to total events
  // Using fixed thresholds for deterministic results
  const seriousRatio = adverseEventsData.seriousCount / adverseEventsData.eventCount;
  
  let severity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  let confidence = 75; // Base confidence for adverse event data
  
  if (seriousRatio >= 0.05) { // 5% or more serious events
    severity = "severe";
  } else if (seriousRatio >= 0.01) { // 1-5% serious events
    severity = "moderate";
  } else if (adverseEventsData.seriousCount > 0) { // Any serious events
    severity = "minor";
  } else if (adverseEventsData.eventCount > 50) { // Many events but none serious
    severity = "minor";
    confidence = 60;
  } else {
    severity = "safe";
    confidence = 60;
  }
  
  // Ensure consistent description based on event counts
  const description = getEventDescription(adverseEventsData, severity);
  
  // Create source with event data for the severity calculation table
  return {
    name: "OpenFDA Adverse Events",
    severity,
    description,
    confidence,
    eventData: {
      totalEvents: adverseEventsData.eventCount,
      seriousEvents: adverseEventsData.seriousCount,
      nonSeriousEvents: adverseEventsData.eventCount - adverseEventsData.seriousCount
    }
  };
}

/**
 * Generate a deterministic description based on event data and severity
 */
function getEventDescription(data: AdverseEventData, severity: "safe" | "minor" | "moderate" | "severe" | "unknown"): string {
  const { eventCount, seriousCount } = data;
  const nonSeriousCount = eventCount - seriousCount;
  
  switch (severity) {
    case "severe":
      return `FDA database contains ${eventCount} reported adverse events, including ${seriousCount} serious cases (${Math.round((seriousCount/eventCount)*100)}%).`;
    case "moderate":
      return `FDA database contains ${eventCount} reported adverse events, with ${seriousCount} serious cases. Monitor closely.`;
    case "minor":
      return `FDA database contains ${eventCount} reported events, with ${seriousCount} serious cases. Generally considered manageable.`;
    case "safe":
      return `FDA database contains ${eventCount} reported events, none classified as serious.`;
    default:
      return `FDA database contains ${eventCount} reported events. Significance unclear.`;
  }
}
