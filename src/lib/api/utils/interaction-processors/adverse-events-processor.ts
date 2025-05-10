
import { InteractionSource, AdverseEventData } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { processAdverseEventsSource } from '../adverse-events-processor';

/**
 * Processes and adds adverse events data to the sources array
 */
export function processAdverseEventsSources(
  adverseEventsResult: AdverseEventData | null,
  sources: InteractionSource[]
): void {
  // Skip processing if no adverse events data
  if (!adverseEventsResult) {
    console.log('No adverse events data to process');
    return;
  }
  
  console.log(`Processing adverse events data with ${adverseEventsResult.eventCount || 0} events`);
  
  try {
    // Add adverse events as a source if found - always high confidence as it's real-world data
    const adverseEventSource = processAdverseEventsSource(adverseEventsResult);
    if (adverseEventSource) {
      // Add debug log before pushing
      logSourceSeverityIssues(adverseEventSource, 'Before push - OpenFDA Events');
      
      // Create proper event data structure for the source
      const eventData = {
        totalEvents: adverseEventsResult.eventCount || 0,
        seriousEvents: adverseEventsResult.seriousCount || 0,
        nonSeriousEvents: (adverseEventsResult.eventCount || 0) - (adverseEventsResult.seriousCount || 0),
        commonReactions: adverseEventsResult.commonReactions || []
      };
      
      // Validate and standardize before pushing - using proper structure to match StandardizedApiResponse
      const standardizedResponse = validateStandardizedResponse({
        sources: [adverseEventSource], // Fix: Use array of InteractionSource instead of strings
        severity: adverseEventSource.severity,
        description: adverseEventSource.description,
        confidence: adverseEventSource.confidence,
        rawData: {},
        processed: false,
        eventData
      });
      
      // Convert standardized response to InteractionSource and push
      const validatedSource = standardizedResponseToSource(standardizedResponse);
      
      // Ensure validatedSource has a severity
      if (!validatedSource.severity) {
        console.warn('Adverse event source missing severity, setting to unknown');
        validatedSource.severity = 'unknown';
      }
      
      sources.push(validatedSource);
      
      // Log the event data to help with debugging
      console.log('OpenFDA Event Data added to source:', eventData);
    } else {
      console.log('No adverse event source created despite having event data');
    }
  } catch (error) {
    console.error('Error processing adverse events data:', error);
    // Create a fallback source for adverse events if processing fails
    sources.push({
      name: "OpenFDA Adverse Events",
      severity: "unknown",
      description: "Adverse events data available but could not be processed",
      confidence: 50,
      eventData: {
        totalEvents: adverseEventsResult.eventCount || 0,
        seriousEvents: adverseEventsResult.seriousCount || 0,
        nonSeriousEvents: (adverseEventsResult.eventCount || 0) - (adverseEventsResult.seriousCount || 0),
        commonReactions: adverseEventsResult.commonReactions || []
      }
    });
  }
}
