
/**
 * API Interactions Processor
 * 
 * This module handles querying multiple medication interaction APIs
 * and processing their responses.
 */

import { InteractionSource, MedicationLookupResult, AdverseEventData, StandardizedApiResponse } from '../types';
import { createDefaultSource } from './severity-processor';
import { processRxNormSources } from './interaction-processors/rxnorm-processor';
import { processSuppAiSources } from './interaction-processors/suppai-processor';
import { processFdaSources } from './interaction-processors/fda-processor';
import { processAdverseEventsSources } from './interaction-processors/adverse-events-processor';
import { processAiLiteratureSources } from './interaction-processors/ai-literature-processor';
import { standardizeAndLogApiResults, enrichApiResults } from './interaction-processors/api-result-processor';
import { fetchAllApiData } from './interaction-processors/parallel-api-fetcher';

/**
 * Processes API queries for a medication pair
 * 
 * @param med1Status First medication lookup result
 * @param med2Status Second medication lookup result 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @returns Object containing all API results and processed sources
 */
export async function processApiInteractions(
  med1Status: MedicationLookupResult,
  med2Status: MedicationLookupResult,
  med1: string,
  med2: string
): Promise<{
  rxnormResult: StandardizedApiResponse | null;
  suppaiResult: StandardizedApiResponse | null;
  fdaResult: StandardizedApiResponse | null;
  adverseEventsResult: AdverseEventData | null;
  aiAnalysisResult: StandardizedApiResponse | null;
  sources: InteractionSource[];
}> {
  console.log(`Checking interactions between ${med1} (${med1Status.id || 'no id'}) and ${med2} (${med2Status.id || 'no id'})`);

  // Fetch all API data in parallel
  const {
    rxnormRawResult,
    suppaiRawResult,
    fdaRawResult,
    adverseEventsResult,
    aiAnalysisRawResult
  } = await fetchAllApiData(med1Status, med2Status, med1, med2);
  
  // Standardize and log API results
  const {
    rxnormResult,
    suppaiResult,
    fdaResult,
    aiAnalysisResult
  } = standardizeAndLogApiResults(
    rxnormRawResult,
    suppaiRawResult,
    fdaRawResult,
    aiAnalysisRawResult
  );
  
  // Enrich standardized results with raw data information
  enrichApiResults(
    rxnormResult,
    suppaiResult,
    fdaResult,
    aiAnalysisResult,
    rxnormRawResult,
    suppaiRawResult,
    fdaRawResult,
    aiAnalysisRawResult
  );

  console.log('API Results:', {
    rxnorm: rxnormResult ? `Found: ${rxnormResult.severity}` : 'No data',
    suppai: suppaiResult ? `Found: ${suppaiResult.severity}` : 'No data',
    fda: fdaResult ? `Found: ${fdaResult.severity}` : 'No data',
    adverseEvents: adverseEventsResult ? `Found ${adverseEventsResult.eventCount} events` : 'No data',
    aiAnalysis: aiAnalysisResult ? `Found: ${aiAnalysisResult.severity}` : 'No data'
  });

  // Merge all sources from different APIs and add confidence values
  const sources: InteractionSource[] = [];
  
  // Process sources from each API
  processRxNormSources(rxnormResult, rxnormRawResult, sources);
  processSuppAiSources(suppaiResult, suppaiRawResult, sources);
  processFdaSources(fdaResult, fdaRawResult, sources);
  processAdverseEventsSources(adverseEventsResult, sources);
  processAiLiteratureSources(aiAnalysisResult, aiAnalysisRawResult, sources);
  
  // Ensure we always have at least one source entry
  if (sources.length === 0) {
    sources.push(createDefaultSource());
  }
  
  return {
    rxnormResult,
    suppaiResult,
    fdaResult, 
    adverseEventsResult,
    aiAnalysisResult,
    sources
  };
}
