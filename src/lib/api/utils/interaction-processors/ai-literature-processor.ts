
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';

/**
 * Improved AI Literature Analysis processor with enhanced validation and reliability checks
 * 
 * Processes and adds AI literature analysis data to the sources array with additional
 * validation to ensure only reliable data is included
 */
export function processAiLiteratureSources(
  aiAnalysisResult: StandardizedApiResponse | null,
  aiAnalysisRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!aiAnalysisResult || !aiAnalysisRawResult) {
    console.log('No AI Literature Analysis data available');
    return;
  }

  // New: Extract confidence score if available, defaulting to 50% if not specified
  const confidenceScore = aiAnalysisRawResult.confidence || 
                        aiAnalysisResult.confidence || 
                        (aiAnalysisRawResult.result?.confidence) || 50;
  
  // New: Check if the description contains error messages that indicate unreliable data
  const description = aiAnalysisResult.description || '';
  const containsErrorMessage = /error occurred|unable to analyze|timed out|failed|invalid/i.test(description);
  
  // New: Add detailed reliability logging
  console.log(`[AI Literature] Reliability check:`, {
    confidence: confidenceScore,
    containsErrorMessage,
    descriptionLength: description.length,
    severity: aiAnalysisResult.severity
  });

  // New: Only include AI results that pass reliability checks:
  // 1. Must have sufficient confidence (≥ 60%)
  // 2. Must not contain error messages
  // 3. Must provide meaningful content
  const isReliable = 
    confidenceScore >= 60 && 
    !containsErrorMessage &&
    description.length > 30;
  
  // Only include AI results that provide meaningful interaction data OR meet reliability criteria
  const hasInsight = (aiAnalysisResult.description &&
                   (aiAnalysisResult.description.toLowerCase().includes('study') || 
                    aiAnalysisResult.description.toLowerCase().includes('research') ||
                    aiAnalysisResult.description.toLowerCase().includes('evidence') ||
                    aiAnalysisResult.description.toLowerCase().includes('risk')));
  
  if ((hasInsight || aiAnalysisResult.severity !== "unknown") && isReliable) {
    // New: Log reliability assessment
    console.log(`[AI Literature] Assessment passed reliability checks (${confidenceScore}% confidence), adding to sources`);
    
    // Add debug log before pushing
    logSourceSeverityIssues(aiAnalysisRawResult, 'Before push - AI Literature');
    
    // Create an enhanced source with reliability information
    const enhancedSource = {
      ...aiAnalysisRawResult,
      source: "AI Literature Analysis",
      confidence: confidenceScore,
      isReliable: true
    };
    
    // Validate and standardize before pushing
    const standardizedResponse = validateStandardizedResponse(enhancedSource);
    
    // Convert standardized response to InteractionSource and push
    const validatedSource = standardizedResponseToSource(standardizedResponse);
    
    // Ensure the confidence score is preserved
    validatedSource.confidence = confidenceScore;
    
    // Add to sources
    sources.push(validatedSource);
    console.log('Added AI literature analysis:', validatedSource);
  } else {
    // New: Add developer warning for unreliable data
    console.warn(`[AI Literature] Assessment failed reliability checks:`, {
      confidence: `${confidenceScore}% (min: 60%)`,
      containsErrorMessage,
      hasInsight,
      severity: aiAnalysisResult.severity
    });
    
    // New: If the content failed reliability checks but has some data,
    // add it with a low confidence flag for diagnostic purposes only
    if (description && description.length > 0 && !containsErrorMessage) {
      const diagnosticSource = {
        name: 'AI Literature Analysis',
        severity: 'unknown',
        description: description,
        confidence: confidenceScore,
        isReliable: false,
        unreliableReason: confidenceScore < 60 ? 'low confidence' : 'insufficient content'
      };
      
      // Only add to sources if we want to display unreliable results (disabled by default)
      // sources.push(diagnosticSource);
      
      // Instead, log it for developer reference
      console.info('[AI Literature] Unreliable data available but not included in sources:', diagnosticSource);
    }
  }
}
