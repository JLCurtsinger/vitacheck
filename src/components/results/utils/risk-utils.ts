
import { InteractionResult } from "@/lib/api-utils";
import { prepareRiskAssessment } from "@/lib/utils/risk-assessment";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

/**
 * Get risk assessment for a single interaction
 */
export function getRiskAssessment(interaction: InteractionResult): RiskAssessmentOutput {
  return prepareRiskAssessment({
    severity: interaction.severity === "severe" ? "severe" : 
              interaction.severity === "moderate" ? "moderate" : "mild",
    fdaReports: { 
      signal: interaction.sources.some(s => s.name === "FDA" && s.severity !== "safe"), 
      count: interaction.sources.find(s => s.name === "FDA")?.eventData?.totalEvents
    },
    openFDA: { 
      signal: interaction.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe"),
      count: interaction.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents  
    },
    suppAI: { 
      signal: interaction.sources.some(s => s.name.includes("AI") && s.severity !== "safe") 
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
  });
}

/**
 * Create a combined risk assessment for multiple medications
 */
export function getCombinedRiskAssessment(
  medications: string[] | undefined,
  interactions: InteractionResult[]
): RiskAssessmentOutput | null {
  if (!medications || medications.length <= 1 || interactions.length === 0) {
    return null;
  }
  
  return prepareRiskAssessment({
    severity: interactions.some(i => i.severity === "severe") ? "severe" : 
              interactions.some(i => i.severity === "moderate") ? "moderate" : "mild",
    fdaReports: { 
      signal: interactions.some(i => 
        i.sources.some(s => s.name === "FDA" && s.severity !== "safe")
      ), 
      count: interactions.reduce((total, i) => 
        total + (i.sources.find(s => s.name === "FDA")?.eventData?.totalEvents || 0), 0)
    },
    openFDA: { 
      signal: interactions.some(i => 
        i.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe")
      ),
      count: interactions.reduce((total, i) => 
        total + (i.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents || 0), 0)
    },
    suppAI: { 
      signal: interactions.some(i =>
        i.sources.some(s => s.name.includes("AI") && s.severity !== "safe")
      ) 
    },
    mechanism: { 
      plausible: interactions.some(i =>
        i.sources.some(s => s.name.includes("Mechanism") && s.severity !== "safe")
      ) 
    },
    aiLiterature: { 
      plausible: interactions.some(i =>
        i.sources.some(s => s.name.includes("Literature") && s.severity !== "safe")
      ) 
    },
    peerReports: { 
      signal: interactions.some(i =>
        i.sources.some(s => s.name.includes("Report") && s.severity !== "safe")
      ) 
    }
  });
}
