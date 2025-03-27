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
  // Add adverse events as a source if found - always high confidence as it's real-world data
  const adverseEventSource = processAdverseEventsSource(adverseEventsResult);
  if (adverseEventSource) {
    // Add debug log before pushing
    logSourceSeverityIssues(adverseEventSource, 'Before push - OpenFDA Events');
    
    // Create proper event data structure for the source
    const eventData = adverseEventsResult ? {
      totalEvents: adverseEventsResult.eventCount || 0,
      seriousEvents: adverseEventsResult.seriousCount || 0,
      nonSeriousEvents: (adverseEventsResult.eventCount || 0) - (adverseEventsResult.seriousCount || 0),
      commonReactions: adverseEventsResult.commonReactions || []
    } : undefined;
    
    // Validate and standardize before pushing
    const standardizedResponse = validateStandardizedResponse({
      ...adverseEventSource,
      // For OpenFDA events, include the event data for confidence calculation
      eventData
    });
    
    // Convert standardized response to InteractionSource and push
    const validatedSource = standardizedResponseToSource(standardizedResponse);
    sources.push(validatedSource);
    
    // Log the event data to help with debugging
    console.log('OpenFDA Event Data added to source:', eventData);
  }
}
