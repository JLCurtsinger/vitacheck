
import { InteractionResult } from "@/lib/api/types";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

/**
 * Analyzes an interaction and returns its risk assessment
 */
export function getRiskAssessment(interaction: InteractionResult): RiskAssessmentOutput | null {
  if (!interaction) return null;
  
  return analyzeInteractionRisk(interaction);
}

/**
 * Gets a combined risk assessment for multiple medications based on all interaction results
 */
export function getCombinedRiskAssessment(
  medications: string[] | undefined,
  interactions: InteractionResult[]
): RiskAssessmentOutput | null {
  if (!medications || medications.length < 2 || !interactions.length) {
    return null;
  }
  
  // Calculate highest risk from all interactions
  let highestRiskScore = 0;
  let highestRiskAssessment: RiskAssessmentOutput | null = null;
  
  for (const interaction of interactions) {
    const risk = getRiskAssessment(interaction);
    if (risk && risk.riskScore > highestRiskScore) {
      highestRiskScore = risk.riskScore;
      highestRiskAssessment = risk;
    }
  }
  
  return highestRiskAssessment;
}
