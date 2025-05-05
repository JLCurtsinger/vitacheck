
import { MedicationLookupResult, AdverseEventData, StandardizedApiResponse } from '../../types';
import { checkRxNormInteractions } from '../../services/interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from '../../services/interactions/suppai-interactions';
import { checkFDAInteractions } from '../../services/interactions/fda-interactions';
import { getAdverseEvents } from '../../openfda-events';
import { queryAiLiteratureAnalysis } from '../../services/ai-literature-analysis';

/**
 * Fetches data from multiple APIs in parallel
 */
export async function fetchAllApiData(
  med1Status: MedicationLookupResult,
  med2Status: MedicationLookupResult,
  med1: string,
  med2: string
): Promise<{
  rxnormRawResult: any | null;
  suppaiRawResult: any | null;
  fdaRawResult: any | null;
  adverseEventsResult: AdverseEventData | null;
  aiAnalysisRawResult: any | null;
  queryTimestamps: Record<string, number>;
}> {
  console.log(`[API Fetcher] Starting parallel API queries for ${med1} + ${med2}`);

  // Record timestamps for each API call
  const queryTimestamps: Record<string, number> = {
    start: Date.now()
  };

  // Query all available databases simultaneously with timeout handling for each
  const apiPromises = [
    // Only check RxNorm if both medications have RxNorm IDs
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm' && med1Status.id && med2Status.id
      ? checkRxNormInteractions(med1Status.id, med2Status.id, med1, med2).catch(err => {
          console.error(`[API Fetcher] RxNorm API error: ${err.message}`);
          queryTimestamps.rxnorm_error = Date.now();
          return null;
        }).then(result => {
          queryTimestamps.rxnorm_end = Date.now();
          return result;
        })
      : Promise.resolve(null),
    
    // SUPP.AI check with error handling
    checkSuppAiInteractions(med1, med2).catch(err => {
      console.error(`[API Fetcher] SUPP.AI API error: ${err.message}`);
      queryTimestamps.suppai_error = Date.now();
      return null;
    }).then(result => {
      queryTimestamps.suppai_end = Date.now();
      return result;
    }),
    
    // FDA check with error handling
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || []).catch(err => {
      console.error(`[API Fetcher] FDA API error: ${err.message}`);
      queryTimestamps.fda_error = Date.now();
      return null;
    }).then(result => {
      queryTimestamps.fda_end = Date.now();
      return result;
    }),
    
    // OpenFDA Adverse Events check with error handling
    getAdverseEvents(med1, med2).catch(err => {
      console.error(`[API Fetcher] OpenFDA Adverse Events API error: ${err.message}`);
      queryTimestamps.openfda_error = Date.now();
      return null;
    }).then(result => {
      queryTimestamps.openfda_end = Date.now();
      return result;
    })
  ];
  
  // AI Analysis is run separately to ensure it doesn't delay API results
  const aiAnalysisPromise = queryAiLiteratureAnalysis(med1, med2).catch(err => {
    console.error(`[API Fetcher] AI Literature Analysis error: ${err.message}`);
    queryTimestamps.ai_literature_error = Date.now();
    return null;
  }).then(result => {
    queryTimestamps.ai_literature_end = Date.now();
    return result;
  });

  // Wait for all API calls to complete (regardless of success/failure)
  const apiResults = await Promise.all(apiPromises);
  const [rxnormRawResult, suppaiRawResult, fdaRawResult, adverseEventsResult] = apiResults;
  
  // Log API results availability
  console.log(`[API Fetcher] API results received:`, {
    rxnorm: rxnormRawResult ? 'Available' : 'Not available',
    suppai: suppaiRawResult ? 'Available' : 'Not available',
    fda: fdaRawResult ? 'Available' : 'Not available',
    adverseEvents: adverseEventsResult ? `Available (${adverseEventsResult.eventCount} events)` : 'Not available',
    timestamps: queryTimestamps
  });
  
  // Try to get AI result but don't let it block the process
  const aiAnalysisRawResult = await aiAnalysisPromise;
  
  queryTimestamps.end = Date.now();
  const totalTime = queryTimestamps.end - queryTimestamps.start;
  console.log(`[API Fetcher] All data fetched in ${totalTime}ms`);

  return {
    rxnormRawResult,
    suppaiRawResult,
    fdaRawResult,
    adverseEventsResult,
    aiAnalysisRawResult,
    queryTimestamps
  };
}
