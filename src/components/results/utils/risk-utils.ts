
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { InteractionResult } from "@/lib/api-utils";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";

/**
 * Analyzes an interaction to determine its risk assessment
 */
export function getRiskAssessment(interaction: InteractionResult): RiskAssessmentOutput | null {
  // Simple risk assessment based on severity if we don't have the detailed assessment
  if (!interaction) return null;
  
  // Return a basic risk assessment based on the interaction severity
  const severity = interaction.severity;
  
  const baseRisk: RiskAssessmentOutput = {
    riskScore: severity === "severe" ? 80 : 
               severity === "moderate" ? 50 : 
               severity === "minor" ? 30 : 
               severity === "unknown" ? 20 : 10,
    severityFlag: severity === "severe" ? '🔴' : 
                  severity === "moderate" || severity === "minor" ? '🟡' : '🟢',
    riskLevel: severity === "severe" ? 'High' : 
              severity === "moderate" ? 'Moderate' : 'Low',
    adjustments: [],
    avoidanceStrategy: 'Consult a healthcare professional for guidance.',
    inputData: {
      severity: severity === "severe" ? "severe" : 
                severity === "moderate" ? "moderate" : "mild"
    }
  };
  
  return baseRisk;
}

/**
 * Gets a detailed risk assessment for an interaction
 */
export async function getInteractionRisk(interaction: InteractionResult): Promise<RiskAssessmentOutput> {
  try {
    // Analyze the interaction risk using the ML-enhanced system
    const riskAssessment = await analyzeInteractionRisk(interaction);
    return riskAssessment;
  } catch (error) {
    console.error("Error analyzing interaction risk:", error);
    // Return a default risk assessment if analysis fails
    return {
      riskScore: 0,
      severityFlag: '🟢',
      riskLevel: 'Low',
      adjustments: [],
      avoidanceStrategy: 'Unable to analyze risk. Please consult a healthcare professional.',
      inputData: {
        severity: 'mild'
      }
    };
  }
}

/**
 * Combines multiple interaction risk assessments into a single overall assessment
 */
export function getCombinedRiskAssessment(
  medications: string[] | undefined, 
  interactions: InteractionResult[]
): RiskAssessmentOutput | null {
  if (!medications || medications.length < 2 || !interactions.length) return null;
  
  // Get the highest risk score and level from all interactions
  let highestRiskScore = 0;
  let highestRiskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal' = 'Low';
  let severestFlag: '🟢' | '🟡' | '🔴' = '🟢';
  
  // Count interactions by severity to determine overall risk
  let severeCount = 0;
  let moderateCount = 0;
  let minorCount = 0;
  
  // Process all interactions to determine the combined risk
  interactions.forEach(interaction => {
    // Count by severity
    if (interaction.severity === "severe") severeCount++;
    if (interaction.severity === "moderate") moderateCount++;
    if (interaction.severity === "minor") minorCount++;
    
    // Get base risk assessment for this interaction
    const risk = getRiskAssessment(interaction);
    if (!risk) return;
    
    // Update highest risk score and level
    if (risk.riskScore > highestRiskScore) {
      highestRiskScore = risk.riskScore;
      highestRiskLevel = risk.riskLevel;
    }
    
    // Update severest flag
    if (risk.severityFlag === '🔴') {
      severestFlag = '🔴';
    } else if (risk.severityFlag === '🟡' && severestFlag !== '🔴') {
      severestFlag = '🟡';
    }
  });
  
  // Calculate an aggregate risk score based on counts
  const totalInteractions = interactions.length;
  const weightedScore = Math.min(
    100,
    (severeCount * 40 + moderateCount * 20 + minorCount * 10) / 
    Math.max(1, totalInteractions) * 2.5
  );
  
  // Use the higher of highest individual risk or weighted score
  const finalRiskScore = Math.max(highestRiskScore, weightedScore);
  
  // Determine final risk level based on the final score
  const finalRiskLevel = 
    finalRiskScore >= 75 ? 'High' :
    finalRiskScore >= 40 ? 'Moderate' : 'Low';
  
  // Create adjustment descriptions based on counts
  const adjustments = [];
  
  if (severeCount > 0) {
    adjustments.push({
      sources: ['Severe Interactions'],
      description: `${severeCount} severe interaction${severeCount > 1 ? 's' : ''} found`
    });
  }
  
  if (moderateCount > 0) {
    adjustments.push({
      sources: ['Moderate Interactions'],
      description: `${moderateCount} moderate interaction${moderateCount > 1 ? 's' : ''} found`
    });
  }
  
  // Generate an avoidance strategy based on risk level
  let avoidanceStrategy = '';
  
  if (finalRiskLevel === 'High') {
    avoidanceStrategy = 'High risk combination detected. Consult with a healthcare provider before taking these medications together.';
  } else if (finalRiskLevel === 'Moderate') {
    avoidanceStrategy = 'Moderate risk combination. Monitor for side effects and consider consulting a healthcare provider.';
  } else {
    avoidanceStrategy = 'Low risk combination. As with any medication, monitor for unexpected side effects.';
  }
  
  return {
    riskScore: Math.round(finalRiskScore),
    severityFlag: severestFlag,
    riskLevel: finalRiskLevel as 'Low' | 'Moderate' | 'High' | 'Lethal',
    adjustments: adjustments,
    avoidanceStrategy: avoidanceStrategy,
    inputData: {
      severity: severeCount > 0 ? 'severe' : moderateCount > 0 ? 'moderate' : 'mild'
    }
  };
}
