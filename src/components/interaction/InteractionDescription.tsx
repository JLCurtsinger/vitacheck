import { InteractionResult } from "@/lib/api-utils";
import { SourceAttributionSection } from "./sections/SourceAttributionSection";
import { ClinicalInformationSection } from "./sections/ClinicalInformationSection";
import { AdditionalInformationSection } from "./sections/AdditionalInformationSection";
import { useNutrientDepletionAnalysis } from "./hooks/useNutrientDepletionAnalysis";
import { containsMildLanguage } from "@/lib/utils/text-analysis";
import { SeverityDisclaimer } from "./severity/SeverityDisclaimer";
import { useState, useEffect } from "react";
import { FDALabelSection } from "./sections/FDALabelSection";

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
  
  // Check if this is a single medication result
  const isSingleMedication = interaction.medications.length === 1;
  
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

  // For single medications, show FDA label information
  if (isSingleMedication) {
    const medication = interaction.medications[0];
    
    // Extract FDA label data from the interaction object
    const fdaLabelData = interaction.fdaLabel ? {
      boxed_warning: interaction.fdaLabel.boxed_warning,
      adverse_reactions: interaction.fdaLabel.adverse_reactions,
      contraindications: interaction.fdaLabel.contraindications,
      warnings_and_cautions: interaction.fdaLabel.warnings_and_cautions,
      drug_interactions: interaction.fdaLabel.drug_interactions
    } : null;

    return (
      <div className="mb-6 space-y-4">
        <FDALabelSection 
          data={fdaLabelData}
          medicationName={medication}
        />
        
        {/* Additional Information Section - only show non-severity related info */}
        <AdditionalInformationSection 
          interaction={interaction} 
          nutrientDepletions={nutrientDepletions}
          hideSeverityBreakdown={true}
        />
      </div>
    );
  }

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
