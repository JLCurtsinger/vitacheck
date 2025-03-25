
import { InteractionResult } from "@/lib/api/types";
import { RiskAssessmentInput, RiskAssessmentOutput } from "./types";

/**
 * Prepares a risk assessment based on interaction data
 * This function consolidates data from various sources to calculate a risk score
 */
export function prepareRiskAssessment(input: RiskAssessmentInput): RiskAssessmentOutput {
  // Initial score based on reported severity
  let riskScore = input.severity === "severe" ? 70 : 
                 input.severity === "moderate" ? 50 : 25;
  
  // Track adjustments for explanation
  const adjustments: string[] = [];
  
  // FDA reports adjustment
  if (input.fdaReports?.signal) {
    const count = input.fdaReports.count || 0;
    if (count > 1000) {
      riskScore += 15;
      adjustments.push("Large number of FDA reports (+15)");
    } else if (count > 100) {
      riskScore += 10;
      adjustments.push("Significant FDA reports (+10)");
    } else if (count > 0) {
      riskScore += 5;
      adjustments.push("FDA reports present (+5)");
    }
  }
  
  // OpenFDA adverse events adjustment
  if (input.openFDA?.signal) {
    const count = input.openFDA.count || 0;
    const percentage = input.openFDA.percentage || 0;
    
    if (percentage > 0.05 && count > 50) {
      riskScore += 20;
      adjustments.push("High percentage of serious adverse events (+20)");
    } else if (percentage > 0.01 && count > 10) {
      riskScore += 10;
      adjustments.push("Moderate adverse event concerns (+10)");
    } else if (count > 0) {
      riskScore += 5;
      adjustments.push("Some adverse events reported (+5)");
    }
  }
  
  // AI analysis and mechanism plausibility
  if (input.suppAI?.signal) {
    riskScore += 5;
    adjustments.push("SUPP.AI detected potential interaction (+5)");
  }
  
  if (input.mechanism?.plausible) {
    riskScore += 8;
    adjustments.push("Plausible biological mechanism identified (+8)");
  }
  
  if (input.aiLiterature?.plausible) {
    riskScore += 7;
    adjustments.push("AI literature analysis found evidence (+7)");
  }
  
  // Peer reports
  if (input.peerReports?.signal) {
    riskScore += 5;
    adjustments.push("Peer-reported interactions (+5)");
  }
  
  // Cap the risk score at 100
  riskScore = Math.min(100, riskScore);
  
  // Determine severity flag based on risk score
  const severityFlag = riskScore >= 70 ? "🔴" : 
                       riskScore >= 40 ? "🟡" : "🟢";
  
  // Generate avoidance strategy if available
  let avoidanceStrategy = "";
  if (riskScore >= 70) {
    avoidanceStrategy = "Consult healthcare provider before taking these medications together.";
  } else if (riskScore >= 40) {
    avoidanceStrategy = "Consider spacing doses or monitoring for symptoms.";
  }
  
  return {
    riskScore,
    severityFlag,
    adjustments,
    avoidanceStrategy,
    inputData: input
  };
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
