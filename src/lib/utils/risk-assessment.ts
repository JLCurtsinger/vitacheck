
/**
 * Risk Assessment Utility
 * 
 * This module provides functions for calculating standardized risk scores
 * based on data from multiple sources.
 */

type Source = {
  signal?: boolean;
  plausible?: boolean;
  score: number;
  weight: number;
};

type Sources = Record<string, Source>;

type Severity = 'mild' | 'moderate' | 'severe';

interface RiskAssessmentInput {
  severity: Severity;
  sources: Sources;
}

interface RiskAssessmentOutput {
  riskScore: number;
  confidence: number;
  severityFlag: '🔴' | '🟡' | '🟢';
}

/**
 * Calculate a standardized risk score based on multiple data sources
 * 
 * @param input Object containing severity level and data sources
 * @returns Standardized risk assessment with risk score, confidence and severity flag
 */
export function calculateRiskScore(input: RiskAssessmentInput): RiskAssessmentOutput {
  const { severity, sources } = input;
  
  // Define severity multipliers
  const severityMultipliers: Record<Severity, number> = {
    'mild': 1,
    'moderate': 1.25,
    'severe': 1.5
  };
  
  const severityMultiplier = severityMultipliers[severity] || 1;
  
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

/**
 * Example usage:
 * 
 * const result = calculateRiskScore({
 *   severity: 'moderate',
 *   sources: {
 *     openFDA: { signal: true, score: 75, weight: 0.9 },
 *     suppAI: { signal: false, score: 40, weight: 0.5 },
 *     peerReports: { plausible: true, score: 60, weight: 0.7 }
 *   }
 * });
 * 
 * // Result would contain:
 * // {
 * //   riskScore: (calculated value 0-100),
 * //   confidence: (calculated value 0-100),
 * //   severityFlag: '🔴', '🟡', or '🟢'
 * // }
 */
