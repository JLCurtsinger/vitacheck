
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';

/**
 * Processes and adds RxNorm interaction sources to the sources array
 */
export function processRxNormSources(
  rxnormResult: StandardizedApiResponse | null,
  rxnormRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!rxnormResult || !rxnormRawResult) return;

  rxnormRawResult.sources?.forEach((source: InteractionSource) => {
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
      sources.push(validatedSource);
    }
  });
}
