
import { useState, useEffect } from "react";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";
import { cn } from "@/lib/utils";
import { RiskAssessmentModal } from "./RiskAssessmentModal";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";
import { HighRiskWarning } from "./severity/HighRiskWarning";
import { RiskAssessmentButton } from "./risk/RiskAssessmentButton";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { PubMedFallback } from "./sections/PubMedFallback";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessmentOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const severityColorMap = {
    "severe": "border-red-200 bg-red-50/30",
    "moderate": "border-yellow-300 bg-yellow-50/40",
    "minor": "border-yellow-200 bg-yellow-50/30",
    "unknown": "border-gray-200",
    "safe": "border-green-200 bg-green-50/30"
  };

  // Determine if this is a high-risk interaction
  const isHighRisk = riskAssessment?.riskScore >= 70;

  // Determine if we should show PubMed fallback
  // Only show if:
  // 1. There are no meaningful sources or all sources are "unknown"
  // 2. The interaction isn't already marked as "safe"
  const hasStructuredData = interaction.sources?.some(
    source => source.severity !== "unknown" && source.name !== "Default"
  );
  
  const shouldShowFallback = 
    !hasStructuredData && 
    interaction.severity !== "safe" &&
    interaction.medications.length > 0;
  
  // If we need fallback, use the first medication as search term
  // This is a simplification - ideally we'd search for both medications
  const fallbackSearchTerm = shouldShowFallback ? 
    interaction.medications[0] : undefined;

  return (
    <div className={cn(
      "p-6 transition-transform hover:scale-[1.01]",
      severityColorMap[interaction.severity]
    )}>
      <InteractionHeader 
        interaction={interaction} 
        severityFlag={riskAssessment?.severityFlag || '🟡'}
        isLoading={isLoading}
      />
      
      <HighRiskWarning isHighRisk={!!isHighRisk} />
      
      <InteractionDescription interaction={interaction} />
      
      {/* PubMed Fallback - only shown when no structured data is available */}
      {shouldShowFallback && fallbackSearchTerm && (
        <PubMedFallback 
          searchTerm={fallbackSearchTerm}
          shouldFetch={shouldShowFallback}
        />
      )}
      
      <InteractionFooter interaction={interaction} />
      
      <RiskAssessmentButton onClick={() => setRiskModalOpen(true)} />
      
      {riskAssessment && (
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
