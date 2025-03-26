
import { InteractionResult } from "@/lib/api/types";
import { RiskAssessmentInput, RiskAssessmentOutput } from "./types";
import { calculateRiskScore } from "./calculator";
import { enhanceRiskAssessment, initializeModel } from "@/lib/ml/risk-prediction-model";

// Initialize the ML model in the background when this module is imported
initializeModel();

/**
 * Prepares a risk assessment based on interaction data
 * This function consolidates data from various sources to calculate a risk score
 * and enhances it with ML predictions when available
 */
export async function prepareRiskAssessment(
  input: RiskAssessmentInput, 
  medications: string[] = []
): Promise<RiskAssessmentOutput> {
  // First calculate using the rule-based system
  const baseOutput = calculateRiskScore(input);
  
  try {
    // Then enhance with ML predictions if possible
    return await enhanceRiskAssessment(input, baseOutput, medications);
  } catch (error) {
    // Fall back to rule-based output if ML enhancement fails
    console.error('Error in ML risk enhancement:', error);
    return baseOutput;
  }
}

/**
 * Analyzes an interaction result to extract risk assessment data
 */
export async function analyzeInteractionRisk(interaction: InteractionResult): Promise<RiskAssessmentOutput> {
  // Extract data from the interaction result
  const input: RiskAssessmentInput = {
    severity: interaction.severity === "severe" ? "severe" : 
              interaction.severity === "moderate" ? "moderate" : "mild",
    fdaReports: { 
      signal: interaction.sources.some(s => s.name === "FDA" && s.severity !== "safe"), 
      count: interaction.sources.find(s => s.name === "FDA")?.eventData?.totalEvents
    },
    openFDA: { 
      signal: interaction.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe"),
      count: interaction.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents,
      percentage: interaction.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.seriousPercentage
    },
    suppAI: { 
      signal: interaction.sources.some(s => s.name.includes("SUPP.AI") && s.severity !== "safe") 
    },
    mechanism: { 
      plausible: interaction.sources.some(s => s.name.includes("Mechanism") && s.severity !== "safe") 
    },
    aiLiterature: { 
      plausible: interaction.sources.some(s => s.name.includes("Literature") && s.severity !== "safe") 
    },
    peerReports: { 
      signal: interaction.sources.some(s => s.name.includes("Report") && s.severity !== "safe") 
    }
  };
  
  // Generate the risk assessment with ML enhancement
  return prepareRiskAssessment(input, interaction.medications);
}

// Export types for use in other modules
export { type RiskAssessmentInput, type RiskAssessmentOutput } from "./types";
