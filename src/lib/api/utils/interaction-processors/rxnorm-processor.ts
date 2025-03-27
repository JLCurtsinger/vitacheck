
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
  
  // Initial source count for diagnostic logging
  const initialSourceCount = sources.length;
  console.log(`[RxNorm] Starting processing with ${initialSourceCount} sources`);
  
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
        console.log(`[RxNorm] Found ${interactions.length} interactions in fullInteractionType`);
        
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
              console.log(`[RxNorm] Created synthetic source from direct API data: "${syntheticSource.severity}" severity, ${syntheticSource.description.length} chars description`);
              sources.push(syntheticSource);
            }
          }
        }
        
        console.log(`[RxNorm] Recovery attempt added ${sources.length - initialSourceCount} sources`);
      }
      
      return;
    }

    console.log(`[RxNorm] Processing ${rxnormRawResult.sources.length} sources from response`);
    let validSourcesCount = 0;
    let excludedSourcesCount = 0;
    
    rxnormRawResult.sources.forEach((source: InteractionSource, index: number) => {
      // Only add relevant sources with interaction data
      const isRelevant = source.description && 
                        !source.description.toLowerCase().includes('no interaction');
      
      console.log(`[RxNorm] Examining source #${index}: ${isRelevant ? 'Relevant' : 'Not relevant'}`);
      
      if (isRelevant) {
        // Add debug log before pushing
        console.log(`[RxNorm] Processing relevant source: "${source.severity}" severity, description length: ${source.description?.length || 0}`);
        
        // Validate and standardize the source before pushing
        const standardizedResponse = validateStandardizedResponse({
          ...source,
          source: "RxNorm"
        });
        
        console.log(`[RxNorm] Standardized response: severity="${standardizedResponse.severity}", confidence=${standardizedResponse.confidence}`);
        
        // Convert standardized response to InteractionSource and push
        const validatedSource = standardizedResponseToSource(standardizedResponse);
        
        if (validatedSource) {
          console.log(`[RxNorm] Adding validated source: "${validatedSource.severity}" severity, confidence=${validatedSource.confidence}`);
          sources.push(validatedSource);
          validSourcesCount++;
        } else {
          // Try fallback logic if the source doesn't pass validation
          console.log(`[RxNorm] Standard validation failed, attempting fallback for source`);
          const fallbackSource = applySourceValidationFallback(source, rxnormRawResult);
          if (fallbackSource) {
            sources.push(fallbackSource);
            console.log('[RxNorm] Added fallback source after standard validation failed');
            validSourcesCount++;
          } else {
            excludedSourcesCount++;
            console.log('[RxNorm] Fallback validation also failed, source excluded');
          }
        }
      } else {
        excludedSourcesCount++;
        console.log(`[RxNorm] Source excluded: ${source.description?.substring(0, 100) || 'No description'}`);
      }
    });
    
    console.log(`[RxNorm] Processing summary: ${validSourcesCount} valid sources added, ${excludedSourcesCount} sources excluded`);
    console.log(`[RxNorm] Total sources after processing: ${sources.length}`);
    
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
