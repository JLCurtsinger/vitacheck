
import { InteractionSource, AdverseEventData } from '../types';

/**
 * Processes OpenFDA adverse events data and creates a formatted source object
 */
export function processAdverseEventsSource(adverseEvents: AdverseEventData | null): InteractionSource | null {
  if (!adverseEvents || !adverseEvents.eventCount) {
    return null;
  }
  
  // Log what we've received for debugging
  console.log('Processing OpenFDA adverse events:', {
    eventCount: adverseEvents.eventCount,
    seriousCount: adverseEvents.seriousCount,
    commonReactions: adverseEvents.commonReactions || []
  });
  
  // Calculate the percentage of serious events
  const seriousPercentage = adverseEvents.seriousCount / adverseEvents.eventCount;
  
  // Determine severity based on serious percentage
  let severity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  
  if (seriousPercentage >= 0.05) {
    // More than 5% serious events is considered severe
    severity = "severe";
  } else if (seriousPercentage >= 0.01) {
    // 1-5% serious events is moderate
    severity = "moderate";
  } else if (adverseEvents.eventCount > 10) {
    // Many events but very few serious ones is minor
    severity = "minor";
  } else {
    // Very few events is considered relatively safe
    severity = "minor";  // Changed from safe to minor as nothing is truly "safe"
  }
  
  // Format description to include common reactions
  let description = `${adverseEvents.eventCount.toLocaleString()} adverse events reported, with ${adverseEvents.seriousCount.toLocaleString()} serious cases (${(seriousPercentage * 100).toFixed(2)}%).`;
  
  const commonReactions = adverseEvents.commonReactions || [];
  if (commonReactions.length > 0) {
    description += ` Common reactions include: ${commonReactions.slice(0, 3).join(", ")}.`;
  }
  
  // Create the source object
  const source: InteractionSource = {
    name: "OpenFDA Adverse Events",
    severity,
    description,
    confidence: 95,  // Real-world data has high confidence
    eventData: {
      totalEvents: adverseEvents.eventCount,
      seriousEvents: adverseEvents.seriousCount,
      nonSeriousEvents: adverseEvents.eventCount - adverseEvents.seriousCount,
      seriousPercentage,  // Add the percentage for more precise weight calculation
      commonReactions     // Add common reactions to event data
    }
  };
  
  return source;
}
