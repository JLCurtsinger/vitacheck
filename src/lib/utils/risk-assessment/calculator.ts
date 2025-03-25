
/**
 * Risk Assessment Calculator
 * 
 * Core logic for calculating standardized risk scores.
 */

import { RiskAssessmentInput, RiskAssessmentOutput } from './types';
import { SEVERITY_MULTIPLIERS } from './constants';

/**
 * Calculate a standardized risk score based on multiple data sources
 * 
 * @param input Object containing severity level and data sources
 * @returns Standardized risk assessment with risk score, confidence and severity flag
 */
export function calculateRiskScore(input: RiskAssessmentInput): RiskAssessmentOutput {
  const { severity, sources } = input;
  
  const severityMultiplier = SEVERITY_MULTIPLIERS[severity] || 1;
  
  // Filter for active sources (those with signal or plausible = true)
  const activeSources = Object.entries(sources).filter(([_, source]) => 
    source.signal === true || source.plausible === true
  );
  
  // Calculate weighted risk score
  let rawRiskScore = 0;
  activeSources.forEach(([_, source]) => {
    rawRiskScore += source.weight * source.score * severityMultiplier;
  });
  
  // Normalize score to max of 100
  const riskScore = Math.min(Math.round(rawRiskScore), 100);
  
  // Calculate confidence score
  // Start at 50, add 10 for each active source, cap at 100
  const confidence = Math.min(50 + (activeSources.length * 10), 100);
  
  // Determine severity flag based on risk score
  let severityFlag: '🔴' | '🟡' | '🟢';
  if (riskScore >= 70) {
    severityFlag = '🔴';
  } else if (riskScore >= 40) {
    severityFlag = '🟡';
  } else {
    severityFlag = '🟢';
  }
  
  return {
    riskScore,
    confidence,
    severityFlag
  };
}
