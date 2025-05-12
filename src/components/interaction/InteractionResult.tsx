import { useState, useEffect } from "react";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";
import { RiskAssessmentButton } from "./risk/RiskAssessmentButton";
import { RiskAssessmentModal } from "./RiskAssessmentModal";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { cn } from "@/lib/utils";
import { getSeverityClasses } from "@/lib/utils/severity-utils";
import { HighRiskWarning } from "./severity/HighRiskWarning";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if this is a single medication result
  const isSingleMedication = interaction.medications.length === 1;
  
  // Generate risk assessment data from the interaction object
  useEffect(() => {
    let isMounted = true;
    
    const loadRiskAssessment = async () => {
      setIsLoading(true);
      try {
        const assessment = await analyzeInteractionRisk(interaction);
        if (isMounted) {
          setRiskAssessment(assessment);
        }
      } catch (error) {
        console.error("Error generating risk assessment:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadRiskAssessment();
    
    return () => {
      isMounted = false;
    };
  }, [interaction]);

  // Determine if this is a high-risk interaction
  const isHighRisk = riskAssessment?.riskScore >= 70;

  return (
    <div className={cn(
      "p-6 transition-transform hover:scale-[1.01]",
      isSingleMedication ? "bg-white" : getSeverityClasses(interaction.severity)
    )}>
      <InteractionHeader 
        interaction={interaction} 
        severityFlag={riskAssessment?.severityFlag || '🟡'}
        isLoading={isLoading}
      />
      
      {!isSingleMedication && <HighRiskWarning isHighRisk={!!isHighRisk} />}
      
      <InteractionDescription interaction={interaction} />
      <InteractionFooter interaction={interaction} />
      
      {!isSingleMedication && <RiskAssessmentButton onClick={() => setRiskModalOpen(true)} />}
      
      {riskAssessment && !isSingleMedication && (
        <RiskAssessmentModal
          open={riskModalOpen}
          onOpenChange={setRiskModalOpen}
          riskAssessment={riskAssessment}
          medications={interaction.medications}
        />
      )}
    </div>
  );
}
