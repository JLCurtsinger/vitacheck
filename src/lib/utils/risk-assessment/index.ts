
import { InteractionResult } from "@/lib/api/types";
import { RiskAssessmentInput, RiskAssessmentOutput } from "./types";
import { calculateRiskScore } from "./calculator";

/**
 * Prepares a risk assessment based on interaction data
 * This function consolidates data from various sources to calculate a risk score
 */
export function prepareRiskAssessment(input: RiskAssessmentInput): RiskAssessmentOutput {
  return calculateRiskScore(input);
}

/**
 * Analyzes an interaction result to extract risk assessment data
 */
export function analyzeInteractionRisk(interaction: InteractionResult): RiskAssessmentOutput {
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
  
  // Generate the risk assessment
  return prepareRiskAssessment(input);
}

export { type RiskAssessmentInput, type RiskAssessmentOutput } from "./types";
