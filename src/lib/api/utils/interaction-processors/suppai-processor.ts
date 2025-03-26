
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';

/**
 * Processes and adds SUPP.AI interaction sources to the sources array
 */
export function processSuppAiSources(
  suppaiResult: StandardizedApiResponse | null,
  suppaiRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!suppaiResult || !suppaiRawResult) return;

  suppaiRawResult.sources?.forEach((source: InteractionSource) => {
    // Filter to only include sources with actual evidence
    const hasEvidence = source.description && 
                       (source.description.toLowerCase().includes('evidence') ||
                        source.description.toLowerCase().includes('study') ||
                        source.description.toLowerCase().includes('reported'));
    
    if (hasEvidence || source.severity !== 'unknown') {
      // Add debug log before pushing
      logSourceSeverityIssues(source, 'Before push - SUPP.AI');
      
      // Validate and standardize the source before pushing
      const standardizedResponse = validateStandardizedResponse({
        ...source,
        source: "SUPP.AI"
      });
      
      // Convert standardized response to InteractionSource and push
      const validatedSource = standardizedResponseToSource(standardizedResponse);
      sources.push(validatedSource);
    }
  });
}
