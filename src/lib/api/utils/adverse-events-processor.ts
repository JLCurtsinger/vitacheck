
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
  let confidence = 70; // Base confidence for adverse event data (slightly reduced)
  
  // Log the event data for debugging
  console.log(`Adverse events: ${adverseEvents.eventCount} total, ${adverseEvents.seriousCount} serious (${seriousPercentage * 100}%)`);
  
  // More conservative thresholds to prevent overclassification as severe
  if (seriousPercentage >= 0.03 && adverseEvents.seriousCount > 10) {
    // More than 3% serious events and at least 10 serious cases (more stringent)
    severity = "severe";
    confidence = 80;
    console.log(`Adverse events classified as SEVERE (${seriousPercentage * 100}% serious and ${adverseEvents.seriousCount} cases)`);
  } else if (seriousPercentage >= 0.01 && adverseEvents.seriousCount > 5) {
    // Between 1-3% serious events and at least 5 serious cases
    severity = "moderate";
    confidence = 75;
    console.log(`Adverse events classified as MODERATE (${seriousPercentage * 100}% serious and ${adverseEvents.seriousCount} cases)`);
  } else if (adverseEvents.seriousCount > 0) {
    // At least one serious event but below threshold
    severity = "minor";
    confidence = 70;
    console.log(`Adverse events classified as MINOR (${adverseEvents.seriousCount} serious cases but below threshold)`);
  } else if (adverseEvents.eventCount > 20) {
    // Many non-serious events
    severity = "minor";
    confidence = 65;
    console.log(`Adverse events classified as MINOR (${adverseEvents.eventCount} non-serious events)`);
  } else {
    // Few non-serious events
    severity = "safe";
    confidence = 60;
    console.log(`Adverse events classified as SAFE (few non-serious events)`);
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
    confidence
  };
}
