import { InteractionSource, AdverseEventData, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { processAdverseEventsSource } from '../adverse-events-processor';
import { getUsageStats } from '@/services/usage';

/**
 * Processes and adds adverse events data to the sources array
 */
export async function processAdverseEventsSources(
  adverseEventsResult: AdverseEventData | null,
  sources: InteractionSource[]
): Promise<void> {
  // Skip processing if no adverse events data
  if (!adverseEventsResult) {
    return;
  }

  try {
    const eventData = {
      totalEvents: adverseEventsResult.eventCount || 0,
      seriousEvents: adverseEventsResult.seriousCount || 0,
      nonSeriousEvents: (adverseEventsResult.eventCount || 0) - (adverseEventsResult.seriousCount || 0),
      commonReactions: adverseEventsResult.commonReactions || []
    };

    // Get CMS usage data using the drug name from the source
    const drugName = sources[0]?.name || '';
    const usageStats = await getUsageStats(drugName);

    // Create the adverse events source
    const standardizedResponse: StandardizedApiResponse = {
      sources: [],
      severity: 'unknown',
      description: `Based on FDA adverse event reports, there were ${eventData.totalEvents.toLocaleString()} total adverse events reported, with ${eventData.seriousEvents.toLocaleString()} serious cases.`,
      confidence: 1,
      rawData: {
        ...eventData,
        cms_usage: usageStats
      },
      processed: false
    };

    const validatedResponse = validateStandardizedResponse(standardizedResponse);
    sources.push(standardizedResponseToSource(validatedResponse));

  } catch (error) {
    console.error('Error processing adverse events:', error);
    // Create a fallback source for logging
    const fallbackSource: InteractionSource = {
      name: 'adverse_events',
      severity: 'unknown',
      description: 'Error processing adverse events data',
      confidence: 0
    };
    logSourceSeverityIssues(fallbackSource, error);
  }
}
