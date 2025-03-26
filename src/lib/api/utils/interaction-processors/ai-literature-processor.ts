
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';

/**
 * Processes and adds AI literature analysis data to the sources array
 */
export function processAiLiteratureSources(
  aiAnalysisResult: StandardizedApiResponse | null,
  aiAnalysisRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!aiAnalysisResult || !aiAnalysisRawResult) return;

  // Only include AI results that provide meaningful interaction data
  const hasInsight = aiAnalysisResult.description &&
                   (aiAnalysisResult.description.toLowerCase().includes('study') || 
                    aiAnalysisResult.description.toLowerCase().includes('research') ||
                    aiAnalysisResult.description.toLowerCase().includes('evidence') ||
                    aiAnalysisResult.description.toLowerCase().includes('risk'));
  
  if (hasInsight || aiAnalysisResult.severity !== "unknown") {
    // Add debug log before pushing
    logSourceSeverityIssues(aiAnalysisRawResult, 'Before push - AI Literature');
    
    // Validate and standardize before pushing
    const standardizedResponse = validateStandardizedResponse({
      ...aiAnalysisRawResult,
      source: "AI Literature Analysis"
    });
    
    // Convert standardized response to InteractionSource and push
    const validatedSource = standardizedResponseToSource(standardizedResponse);
    sources.push(validatedSource);
    console.log('Added AI literature analysis:', validatedSource);
  }
}
