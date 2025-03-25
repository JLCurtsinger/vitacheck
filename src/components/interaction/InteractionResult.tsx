
import { useState } from "react";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";
import { cn } from "@/lib/utils";
import { RiskAssessmentModal } from "./RiskAssessmentModal";
import { prepareRiskAssessment } from "@/lib/utils/risk-assessment";
import { HighRiskWarning } from "./severity/HighRiskWarning";
import { RiskAssessmentButton } from "./risk/RiskAssessmentButton";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  
  // Prepare risk assessment data from the interaction object
  const riskAssessment = prepareRiskAssessment({
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

  const severityColorMap = {
    "severe": "border-red-200 bg-red-50/30",
    "moderate": "border-yellow-300 bg-yellow-50/40",
    "minor": "border-yellow-200 bg-yellow-50/30",
    "unknown": "border-gray-200",
    "safe": "border-green-200 bg-green-50/30"
  };

  // Determine if this is a high-risk interaction
  const isHighRisk = riskAssessment.riskScore >= 70;

  return (
    <div className={cn(
      "p-6 transition-transform hover:scale-[1.01]",
      severityColorMap[interaction.severity]
    )}>
      <InteractionHeader 
        interaction={interaction} 
        severityFlag={riskAssessment.severityFlag}
      />
      
      <HighRiskWarning isHighRisk={isHighRisk} />
      
      <InteractionDescription interaction={interaction} />
      <InteractionFooter interaction={interaction} />
      
      <RiskAssessmentButton onClick={() => setRiskModalOpen(true)} />
      
      <RiskAssessmentModal
        open={riskModalOpen}
        onOpenChange={setRiskModalOpen}
        riskAssessment={riskAssessment}
      />
    </div>
  );
}
