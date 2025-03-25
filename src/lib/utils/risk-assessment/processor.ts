
/**
 * Risk Assessment Processor
 * 
 * Utilities for preparing and processing risk assessment data.
 */

import { calculateRiskScore } from './calculator';
import { RawRiskData, EnhancedRiskAssessmentOutput, Sources, RiskAssessmentInput } from './types';
import { SOURCE_WEIGHTS, DEFAULT_SCORES } from './constants';

/**
 * Prepares raw API response data for risk assessment calculation
 * 
 * @param inputData Object containing raw data from various API sources
 * @returns Enhanced risk assessment output with original input summary
 */
export function prepareRiskAssessment(inputData: RawRiskData): EnhancedRiskAssessmentOutput {
  const { severity } = inputData;
  const sources: Sources = {};
  
  // Process each potential source in the input data
  Object.entries(inputData).forEach(([key, value]) => {
    // Skip the severity field and any undefined sources
    if (key === 'severity' || !value) return;
    
    const source = value;
    
    // Only include sources with defined signal or plausible flags
    if (source.signal !== undefined || source.plausible !== undefined) {
      // Calculate score based on count if available, otherwise use default
      let score = DEFAULT_SCORES[key as keyof typeof DEFAULT_SCORES] || 50;
      
      // Adjust score if count is provided (higher count = higher score)
      if (source.count !== undefined) {
        // Simple formula: base 40 + scaled value based on count (max 100)
        score = 40 + Math.min(Math.round(source.count / 2), 60);
      }
      
      // Get weight from constants or default to 0.2
      const weight = SOURCE_WEIGHTS[key as keyof typeof SOURCE_WEIGHTS] || 0.2;
      
      // Add the formatted source to our sources object
      sources[key] = {
        signal: source.signal,
        plausible: source.plausible,
        score,
        weight
      };
    }
  });
  
  // Prepare input for risk calculation
  const riskInput: RiskAssessmentInput = {
    severity,
    sources
  };
  
  // Calculate risk score
  const riskOutput = calculateRiskScore(riskInput);
  
  // Return enhanced output with input summary
  return {
    ...riskOutput,
    inputSummary: {
      severity,
      sources
    }
  };
}
