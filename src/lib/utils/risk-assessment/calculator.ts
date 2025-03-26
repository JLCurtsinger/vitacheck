
import { RiskAssessmentInput, RiskAssessmentOutput } from './types';

/**
 * Calculates a risk score based on interaction data
 * This is the rule-based system that serves as a fallback
 * when ML predictions are not available
 */
export function calculateRiskScore(input: RiskAssessmentInput): RiskAssessmentOutput {
  // Base score variables
  let baseScore = 0;
  let contributingFactors: string[] = [];
  
  // Score based on severity
  if (input.severity === 'severe') {
    baseScore += 50;
    contributingFactors.push('Severe interaction severity');
  } else if (input.severity === 'moderate') {
    baseScore += 30;
    contributingFactors.push('Moderate interaction severity');
  } else {
    baseScore += 10;
    contributingFactors.push('Mild interaction severity');
  }
  
  // Process FDA reports
  if (input.fdaReports?.signal) {
    baseScore += 15;
    contributingFactors.push('FDA adverse event reports');
  }
  
  // Process OpenFDA data
  if (input.openFDA?.signal) {
    baseScore += 10;
    if (input.openFDA.percentage && input.openFDA.percentage > 30) {
      baseScore += 10;
      contributingFactors.push('High percentage of serious OpenFDA reports');
    } else {
      contributingFactors.push('OpenFDA adverse events reported');
    }
  }
  
  // Process SUPP.AI data
  if (input.suppAI?.signal) {
    baseScore += 7;
    contributingFactors.push('SUPP.AI identified interaction');
  }
  
  // Process mechanism plausibility
  if (input.mechanism?.plausible) {
    baseScore += 8;
    contributingFactors.push('Biologically plausible mechanism');
  }
  
  // Process AI literature analysis
  if (input.aiLiterature?.plausible) {
    baseScore += 7;
    contributingFactors.push('AI literature analysis found supporting evidence');
  }
  
  // Process peer reports
  if (input.peerReports?.signal) {
    baseScore += 10;
    contributingFactors.push('Peer-reviewed research indicates risk');
  }
  
  // Cap the score at 100
  const finalScore = Math.min(Math.round(baseScore), 100);
  
  // Determine severity flag and risk level based on score
  let severityFlag: '🔴' | '🟡' | '🟢';
  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal';
  
  if (finalScore >= 70) {
    severityFlag = '🔴';
    riskLevel = finalScore >= 85 ? 'Lethal' : 'High';
  } else if (finalScore >= 30) {
    severityFlag = '🟡';
    riskLevel = 'Moderate';
  } else {
    severityFlag = '🟢';
    riskLevel = 'Low';
  }
  
  // Generate avoidance strategy based on risk level
  const avoidanceStrategy = generateAvoidanceStrategy(riskLevel);
  
  // Create adjustments from contributing factors
  const adjustments = contributingFactors.map(factor => ({
    sources: ['Rule-based assessment'],
    description: factor
  }));
  
  // Construct and return the output
  return {
    riskScore: finalScore,
    severityFlag,
    riskLevel,
    adjustments,
    avoidanceStrategy,
    inputData: input
  };
}

/**
 * Generates an appropriate avoidance strategy based on risk level
 */
function generateAvoidanceStrategy(riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal'): string {
  switch (riskLevel) {
    case 'Lethal':
      return 'AVOID COMPLETELY. Do not take these medications together under any circumstances. Consult healthcare provider immediately if already taking.';
    case 'High':
      return 'STRONGLY DISCOURAGED. Only use together under strict medical supervision with careful monitoring for adverse effects.';
    case 'Moderate':
      return 'USE WITH CAUTION. Spacing administration times, dose adjustments, or monitoring may be necessary. Consult healthcare provider.';
    case 'Low':
      return 'Generally safe to use together. Monitor for mild side effects and report any unexpected symptoms to healthcare provider.';
  }
}
