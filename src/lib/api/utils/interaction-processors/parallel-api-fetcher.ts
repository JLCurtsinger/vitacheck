
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
}> {
  // Query all available databases simultaneously with timeout handling for each
  // This ensures that even if one API fails or times out, we'll still get results from others
  const apiPromises = [
    // Only check RxNorm if both medications have RxNorm IDs
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm' && med1Status.id && med2Status.id
      ? checkRxNormInteractions(med1Status.id, med2Status.id, med1, med2).catch(err => {
          console.error(`RxNorm API error: ${err.message}`);
          return null;
        })
      : Promise.resolve(null),
    
    // SUPP.AI check with error handling
    checkSuppAiInteractions(med1, med2).catch(err => {
      console.error(`SUPP.AI API error: ${err.message}`);
      return null;
    }),
    
    // FDA check with error handling
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || []),
    
    // OpenFDA Adverse Events check with error handling
    getAdverseEvents(med1, med2).catch(err => {
      console.error(`OpenFDA Adverse Events API error: ${err.message}`);
      return null;
    })
  ];
  
  // AI Analysis is run separately to ensure it doesn't delay API results
  const aiAnalysisPromise = queryAiLiteratureAnalysis(med1, med2).catch(err => {
    console.error(`AI Literature Analysis error: ${err.message}`);
    return null;
  });

  // Wait for all API calls to complete (regardless of success/failure)
  const apiResults = await Promise.all(apiPromises);
  const [rxnormRawResult, suppaiRawResult, fdaRawResult, adverseEventsResult] = apiResults;
  
  // Try to get AI result but don't let it block the process
  const aiAnalysisRawResult = await aiAnalysisPromise;

  return {
    rxnormRawResult,
    suppaiRawResult,
    fdaRawResult,
    adverseEventsResult,
    aiAnalysisRawResult
  };
}
