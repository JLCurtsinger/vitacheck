
import { InteractionResult } from "@/lib/api-utils";
import { SourceAttributionSection } from "./sections/SourceAttributionSection";
import { ClinicalInformationSection } from "./sections/ClinicalInformationSection";
import { AdditionalInformationSection } from "./sections/AdditionalInformationSection";
import { useNutrientDepletionAnalysis } from "./hooks/useNutrientDepletionAnalysis";
import { containsMildLanguage } from "@/lib/utils/text-analysis";
import { SeverityDisclaimer } from "./severity/SeverityDisclaimer";
import { useState, useEffect } from "react";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
}

export function InteractionDescription({ interaction }: InteractionDescriptionProps) {
  // Generate a unique identifier for this interaction if id doesn't exist
  const interactionKey = interaction.id || 
    `${interaction.medications[0]}-${interaction.medications[1]}-${interaction.severity}`;
  
  // Get nutrient depletions using the custom hook
  const nutrientDepletions = useNutrientDepletionAnalysis(interaction);

  // Determine if we need to show the severity disclaimer
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  
  useEffect(() => {
    // Only analyze if the interaction is marked severe
    if (interaction.severity === "severe") {
      // Check description for mild language
      const hasMildDescription = containsMildLanguage(interaction.description || "");
      setShowDisclaimer(hasMildDescription);
    } else {
      setShowDisclaimer(false);
    }
  }, [interaction]);

  return (
    <div className="mb-6 space-y-4">
      {/* Severity Disclaimer - shown when there's a mismatch between severity and description */}
      <SeverityDisclaimer show={showDisclaimer} />
      
      {/* Sources Attribution Section */}
      <SourceAttributionSection interaction={interaction} />

      {/* Clinical Interaction Description Section */}
      <ClinicalInformationSection 
        interaction={interaction} 
        interactionKey={interactionKey} 
      />
      
      {/* Additional Information Section (Severity Breakdown, Adverse Events, etc.) */}
      <AdditionalInformationSection 
        interaction={interaction} 
        nutrientDepletions={nutrientDepletions} 
      />
    </div>
  );
}
