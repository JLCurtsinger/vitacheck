
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { logFullApiResponse, logParsingIssue } from '../diagnostics/api-response-logger';
import { applySourceValidationFallback } from '../consensus-system/source-validation';

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
  
  try {
    // Add detailed validation for RxNorm response structure
    if (!rxnormRawResult.sources || !Array.isArray(rxnormRawResult.sources)) {
      logParsingIssue('RxNorm', rxnormRawResult, 'Missing or invalid sources array');
      
      // Try to recover if the data is in an unexpected format
      if (rxnormRawResult.fullInteractionTypeGroup && 
          rxnormRawResult.fullInteractionTypeGroup.length > 0) {
        console.log('[RxNorm] Attempting to recover interaction data from raw API response');
        
        // Extract interaction data from RxNorm's native format
        const interactions = rxnormRawResult.fullInteractionTypeGroup[0]?.fullInteractionType || [];
        
        for (const interaction of interactions) {
          if (interaction.interactionPair && interaction.interactionPair.length > 0) {
            const pair = interaction.interactionPair[0];
            if (pair.description) {
              // Create a synthetic source from direct API data
              const syntheticSource: InteractionSource = {
                name: "RxNorm",
                severity: pair.severity || "unknown",
                description: pair.description,
                confidence: 90 // High confidence for direct RxNorm data
              };
              
              // Add debug log before pushing
              logSourceSeverityIssues(syntheticSource, 'Recovered from raw RxNorm data');
              sources.push(syntheticSource);
            }
          }
        }
      }
      
      return;
    }

    rxnormRawResult.sources.forEach((source: InteractionSource) => {
      // Only add relevant sources with interaction data
      const isRelevant = source.description && 
                        !source.description.toLowerCase().includes('no interaction');
      
      if (isRelevant) {
        // Add debug log before pushing
        logSourceSeverityIssues(source, 'Before push - RxNorm');
        
        // Validate and standardize the source before pushing
        const standardizedResponse = validateStandardizedResponse({
          ...source,
          source: "RxNorm"
        });
        
        // Convert standardized response to InteractionSource and push
        const validatedSource = standardizedResponseToSource(standardizedResponse);
        
        // Try fallback logic if the source doesn't pass validation
        if (!validatedSource) {
          const fallbackSource = applySourceValidationFallback(source, rxnormRawResult);
          if (fallbackSource) {
            sources.push(fallbackSource);
            console.log('[RxNorm] Added fallback source after standard validation failed');
          }
          return;
        }
        
        sources.push(validatedSource);
      }
    });
    
    // Log if no sources were added after processing
    if (rxnormRawResult.sources.length > 0 && 
        !sources.some(s => s.name === 'RxNorm')) {
      logParsingIssue(
        'RxNorm', 
        rxnormRawResult, 
        'No valid sources found despite raw data being present'
      );
    }
  } catch (error) {
    logParsingIssue('RxNorm', rxnormRawResult, error instanceof Error ? error : String(error));
  }
}
