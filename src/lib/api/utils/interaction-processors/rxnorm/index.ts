
/**
 * RxNorm Processor Module
 * 
 * Main entry point for processing RxNorm interaction data
 */

import { InteractionSource, StandardizedApiResponse } from '../../../types';
import { logParsingIssue, logFullApiResponse } from '../../diagnostics/api-response-logger';
import { validateRxNormResponse, hasValidStructure } from './validator';
import { extractInteractionDataFromNativeFormat, processStandardSources } from './parser';
import { recoverInvalidSource, createErrorSource } from './recovery';

/**
 * Processes and adds RxNorm interaction sources to the sources array
 * Enhanced with detailed logging and fallback mechanisms
 */
export function processRxNormSources(
  rxnormResult: StandardizedApiResponse | null,
  rxnormRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!rxnormResult || !rxnormRawResult) {
    console.log('[RxNorm] No results to process');
    return;
  }

  // Log the full raw results for debugging
  logFullApiResponse('RxNorm', rxnormRawResult, 'pre-processing');
  
  // Initial source count for diagnostic logging
  const initialSourceCount = sources.length;
  console.log(`[RxNorm] Starting processing with ${initialSourceCount} sources`);
  
  try {
    // Validate RxNorm response structure
    if (!hasValidStructure(rxnormRawResult)) {
      logParsingIssue('RxNorm', rxnormRawResult, 'Missing or invalid structure');
      
      // Try to recover using the native RxNorm format
      const recoveredSources = extractInteractionDataFromNativeFormat(rxnormRawResult);
      
      if (recoveredSources.length > 0) {
        sources.push(...recoveredSources);
        console.log(`[RxNorm] Recovery added ${recoveredSources.length} sources`);
      } else {
        console.log('[RxNorm] No sources could be recovered from raw response');
      }
      
      return;
    }

    // Process sources from standard format
    const standardSources = processStandardSources(rxnormRawResult);
    
    // Add sources to the result
    if (standardSources.length > 0) {
      sources.push(...standardSources);
      console.log(`[RxNorm] Added ${standardSources.length} sources from standard format`);
    }
    
    console.log(`[RxNorm] Processing complete. Total sources: ${sources.length}`);
    
    // Log if no sources were added after processing
    if (rxnormRawResult.sources && 
        rxnormRawResult.sources.length > 0 && 
        !sources.some(s => s.name === 'RxNorm')) {
      logParsingIssue(
        'RxNorm', 
        rxnormRawResult, 
        'No valid sources found despite raw data being present'
      );
    }
  } catch (error) {
    logParsingIssue('RxNorm', rxnormRawResult, error instanceof Error ? error : String(error));
    
    // Add an error source to indicate there was an issue
    sources.push(createErrorSource(error));
  }
}
