
/**
 * RxNorm Source Processor 
 * 
 * Processes RxNorm response data to extract interaction information
 */

import { InteractionSource, StandardizedApiResponse } from '../../../types';
import { parseRxNormInteractionData } from './parser';
import { validateRxNormResponse } from './validator';
import { recoverInvalidSource, createErrorSource } from './recovery';
import { logSourceSeverityIssues } from '../../debug-logger';

/**
 * Processes RxNorm responses and adds valid sources to the sources array
 */
export function processRxNormSources(
  rxnormResult: StandardizedApiResponse | null,
  rxnormRawResult: any,
  sources: InteractionSource[]
): void {
  if (!rxnormResult) {
    console.log('No RxNorm data available');
    return;
  }

  try {
    console.log('Processing RxNorm sources');
    
    // First verify the response is valid
    if (!validateRxNormResponse(rxnormRawResult)) {
      console.warn('Invalid RxNorm response data detected');
      return;
    }
    
    // Parse the interaction data 
    const rxnormSources = parseRxNormInteractionData(rxnormResult, rxnormRawResult);
    
    if (rxnormSources && rxnormSources.length > 0) {
      // Add debug log before pushing
      rxnormSources.forEach(source => {
        logSourceSeverityIssues(source, 'Before push - RxNorm');
      });
      
      // Add all valid sources to the provided sources array
      sources.push(...rxnormSources);
      
      console.log(`Added ${rxnormSources.length} RxNorm sources`);
    } else {
      console.log('No valid RxNorm sources found');
    }
    
  } catch (error) {
    // Handle any unexpected errors in processing
    console.error('Error processing RxNorm data:', error);
    
    // Add error source to maintain consistency
    const errorSource = createErrorSource(error);
    sources.push(errorSource);
    
    console.log('Added RxNorm error source due to processing failure');
  }
}
