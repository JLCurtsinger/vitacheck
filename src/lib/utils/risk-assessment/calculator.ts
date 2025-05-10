
import { RiskAssessmentInput, RiskAssessmentOutput } from './types';
import { SOURCE_WEIGHTS, SEVERITY_THRESHOLDS } from './constants';

/**
 * Calculates a risk score based on interaction data
 * This is the rule-based system that serves as a fallback
 * when ML predictions are not available
 */
export function calculateRiskScore(input: RiskAssessmentInput): RiskAssessmentOutput {
  const isDebug = process.env.DEBUG === 'true';
  
  // Base score variables
  let baseScore = 0;
  let contributingFactors: string[] = [];
  
  // Count high-confidence sources reporting severe severity
  let highConfidenceSevereCount = 0;
  let aiOnlySevere = true;
  
  // Score based on severity
  if (input.severity === 'severe') {
    // Only apply full severe weighting if we have corroborating evidence
    // Check if we have high-confidence sources
    if (input.fdaReports?.signal || input.openFDA?.signal || input.rxnorm?.signal) {
      highConfidenceSevereCount++;
      aiOnlySevere = false;
      baseScore += 50;
      contributingFactors.push('Severe interaction severity corroborated by medical database');
    } else if (input.peerReports?.signal) {
      highConfidenceSevereCount++;
      aiOnlySevere = false;
      baseScore += 40;
      contributingFactors.push('Severe interaction severity reported in peer-reviewed research');
    } else {
      // If only AI reports severe, cap the score lower
      baseScore += 30;
      contributingFactors.push('Moderate-severe interaction potential');
    }
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
  
  // Process AI literature analysis - reduced weight
  if (input.aiLiterature?.plausible) {
    // Reduce AI literature weight to prevent it from becoming dominant
    baseScore += 5; // Reduced from 7
    contributingFactors.push('AI literature analysis found supporting evidence');
  }
  
  // Process peer reports
  if (input.peerReports?.signal) {
    baseScore += 10;
    contributingFactors.push('Peer-reviewed research indicates risk');
  }
  
  // RULE 1: Cap the score at moderate level if AI is the only source suggesting severe
  if (input.severity === 'severe' && aiOnlySevere && highConfidenceSevereCount === 0) {
    baseScore = Math.min(baseScore, SEVERITY_THRESHOLDS.MODERATE_RISK + 10); // Cap just above the moderate threshold
    if (isDebug) {
      console.log('🔍 Risk Assessment: Capping risk score due to AI-only severe rating');
    }
  }
  
  // Cap the final score at 100
  const finalScore = Math.min(Math.round(baseScore), 100);
  
  // Determine severity flag and risk level based on score
  let severityFlag: '🔴' | '🟡' | '🟢';
  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal';
  
  if (finalScore >= SEVERITY_THRESHOLDS.HIGH_RISK) {
    // Only show severe if we have non-AI severe sources or multiple moderate sources
    if ((input.severity === 'severe' && !aiOnlySevere) || 
        (contributingFactors.filter(f => f.includes('moderate') || f.includes('Moderate')).length >= 2)) {
      severityFlag = '🔴';
      riskLevel = finalScore >= 85 ? 'Lethal' : 'High';
    } else {
      // Downgrade to moderate if AI is the only source
      severityFlag = '🟡';
      riskLevel = 'Moderate';
    }
  } else if (finalScore >= SEVERITY_THRESHOLDS.MODERATE_RISK) {
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
