
/**
 * Adverse Events Processor
 * 
 * This module processes adverse event data from FDA databases
 * into standardized formats for decision making.
 */

import { InteractionSource, AdverseEventData, StandardizedApiResponse } from '../../types';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { logSourceSeverityIssues } from '../debug-logger';

/**
 * Processes and adds FDA adverse event sources to the sources array
 */
export function processAdverseEventsSources(
  adverseEvents: AdverseEventData | null,
  sources: InteractionSource[]
): void {
  if (!adverseEvents) return;

  // Only create a source if we have a meaningful number of events
  if (adverseEvents.eventCount > 5) {
    // Calculate severity based on seriousness ratio
    const severity = determineAdverseEventSeverity(adverseEvents);
    
    // Generate description based on event counts
    const description = generateAdverseEventDescription(adverseEvents);
    
    // Create the source object for adverse events
    const source: InteractionSource = {
      name: "OpenFDA Adverse Events",
      severity,
      description,
      confidence: determineConfidenceScore(adverseEvents),
      eventData: {
        totalEvents: adverseEvents.eventCount,
        seriousEvents: adverseEvents.seriousCount,
        nonSeriousEvents: adverseEvents.eventCount - adverseEvents.seriousCount,
        commonReactions: adverseEvents.commonReactions
      }
    };
    
    // Add debug log before pushing
    logSourceSeverityIssues(source, 'Before push - OpenFDA Adverse Events');
    
    // Validate and standardize the source before pushing
    const standardizedSourceArray: InteractionSource[] = [source];
    const standardizedResponse = validateStandardizedResponse({
      sources: standardizedSourceArray,
      severity: source.severity,
      description: source.description,
      confidence: source.confidence,
      eventData: source.eventData,
      rawData: {},
      processed: false
    });
    
    // Convert standardized response to InteractionSource and push
    const validatedSource = standardizedResponseToSource(standardizedResponse);
    sources.push(validatedSource);
  }
}

/**
 * Determines severity level based on adverse event data
 */
function determineAdverseEventSeverity(
  adverseEvents: AdverseEventData
): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  // Calculate percentage of serious events
  const totalEvents = adverseEvents.eventCount || 0;
  const seriousEvents = adverseEvents.seriousCount || 0;
  
  if (totalEvents === 0) return "unknown";
  
  const seriousPercentage = (seriousEvents / totalEvents) * 100;
  
  // Determine severity based on serious percentage and absolute counts
  if (seriousPercentage > 30 || seriousEvents > 50) {
    return "severe";
  } else if (seriousPercentage > 15 || seriousEvents > 20) {
    return "moderate";
  } else if (totalEvents > 10) {
    return "minor";
  } else {
    return "unknown"; // Too few events to make a judgment
  }
}

/**
 * Generates a description summarizing adverse event data
 */
function generateAdverseEventDescription(
  adverseEvents: AdverseEventData
): string {
  const { eventCount, seriousCount, commonReactions = [] } = adverseEvents;
  
  // Basic stats
  const totalEvents = eventCount || 0;
  const seriousEvents = seriousCount || 0;
  const nonSeriousEvents = totalEvents - seriousEvents;
  
  // Format percentages for readability
  const seriousPercent = totalEvents > 0 ? Math.round((seriousEvents / totalEvents) * 100) : 0;
  
  // Build description
  let description = `FDA Adverse Event Reporting System (FAERS) shows ${totalEvents} reported adverse events when these substances are taken together. `;
  
  if (seriousEvents > 0) {
    description += `${seriousEvents} (${seriousPercent}%) were classified as serious medical events. `;
  }
  
  // Add information about common reactions if available
  if (commonReactions.length > 0) {
    const reactionsToShow = commonReactions.slice(0, 3);
    description += `Common reported reactions include: ${reactionsToShow.join(', ')}.`;
  }
  
  return description;
}

/**
 * Calculates confidence score based on event quantity and quality
 */
function determineConfidenceScore(
  adverseEvents: AdverseEventData
): number {
  const { eventCount = 0 } = adverseEvents;
  
  // Base confidence on number of events, with diminishing returns
  // This creates a curve from 0.3 to 0.8 based on event count
  let confidence = 0.3 + Math.min(0.5, Math.log10(eventCount + 1) / 3);
  
  return Math.round(confidence * 100) / 100; // Round to 2 decimal places
}
