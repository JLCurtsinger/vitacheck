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
    // Check if moderate severity is due to individual FDA warnings
    if (input.fdaReports?.individualSevereWarnings) {
      baseScore += 25;
      contributingFactors.push('Individual severe warnings exist for these medications');
    } else {
      baseScore += 30;
      contributingFactors.push('Moderate interaction severity');
    }
  } else {
    baseScore += 10;
    contributingFactors.push('Mild interaction severity');
  }
  
  // Process FDA reports
  if (input.fdaReports?.signal) {
    if (input.fdaReports.individualSevereWarnings) {
      baseScore += 10;
      contributingFactors.push('Individual FDA warnings present');
    } else {
      baseScore += 15;
      contributingFactors.push('FDA adverse event reports');
    }
  }
  
  // Process OpenFDA data
  if (input.openFDA?.signal) {
    const eventCount = input.openFDA.count || 0;
    const seriousPercentage = input.openFDA.percentage || 0;
    
    if (seriousPercentage > 25 || eventCount > 1000) {
      baseScore += 20;
      contributingFactors.push('Significant adverse event reports');
    } else if (seriousPercentage > 10 || eventCount > 100) {
      baseScore += 15;
      contributingFactors.push('Moderate adverse event reports');
    } else {
      baseScore += 10;
      contributingFactors.push('Minor adverse event reports');
    }
  }
  
  // Process SUPP.AI data
  if (input.suppAI?.signal) {
    baseScore += 10;
    contributingFactors.push('SUPP.AI interaction data');
  }
  
  // Process RxNorm data
  if (input.rxnorm?.signal) {
    baseScore += 15;
    contributingFactors.push('RxNorm interaction data');
  }
  
  // Process mechanism data
  if (input.mechanism?.plausible) {
    baseScore += 10;
    contributingFactors.push('Plausible interaction mechanism');
  }
  
  // Process AI literature analysis
  if (input.aiLiterature?.plausible) {
    baseScore += 5;
    contributingFactors.push('AI literature analysis');
  }
  
  // Process peer reports
  if (input.peerReports?.signal) {
    baseScore += 15;
    contributingFactors.push('Peer-reviewed reports');
  }
  
  // Cap the final score
  const finalScore = Math.min(100, baseScore);
  
  // Determine risk level
  let riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal' = 'Low';
  if (finalScore >= 75) {
    riskLevel = 'High';
  } else if (finalScore >= 40) {
    riskLevel = 'Moderate';
  }
  
  // Determine severity flag
  let severityFlag: '🟢' | '🟡' | '🔴' = '🟢';
  if (finalScore >= 75 || (input.severity === 'severe' && !aiOnlySevere)) {
    severityFlag = '🔴';
  } else if (finalScore >= 40 || input.severity === 'moderate') {
    severityFlag = '🟡';
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
    riskLevel,
    severityFlag,
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
