
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { CombinationResult } from "@/lib/api/types";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";

export async function getInteractionRisk(interaction: CombinationResult): Promise<RiskAssessmentOutput> {
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
