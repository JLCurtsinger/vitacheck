
import { useState } from "react";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";
import { cn } from "@/lib/utils";
import { RiskAssessmentModal } from "./RiskAssessmentModal";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";
import { HighRiskWarning } from "./severity/HighRiskWarning";
import { RiskAssessmentButton } from "./risk/RiskAssessmentButton";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  
  // Generate risk assessment data from the interaction object
  const riskAssessment = analyzeInteractionRisk(interaction);

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
