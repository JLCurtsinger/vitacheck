
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';

/**
 * Processes and adds FDA interaction sources to the sources array
 */
export function processFdaSources(
  fdaResult: StandardizedApiResponse | null,
  fdaRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!fdaResult || !fdaRawResult) return;

  fdaRawResult.sources?.forEach((source: InteractionSource) => {
    // FDA black box warnings are more reliable
    const hasWarning = source.description && 
                     (source.description.toLowerCase().includes('warning') ||
                      source.description.toLowerCase().includes('caution') ||
                      source.description.toLowerCase().includes('interaction'));
    
    if (hasWarning || source.severity !== 'unknown') {
      // Add debug log before pushing
      logSourceSeverityIssues(source, 'Before push - FDA');
      
      // Validate and standardize the source before pushing
      const standardizedResponse = validateStandardizedResponse({
        ...source,
        source: "FDA"
      });
      
      // Convert standardized response to InteractionSource and push
      const validatedSource = standardizedResponseToSource(standardizedResponse);
      sources.push(validatedSource);
    }
  });
}
