
import { InteractionResult } from "@/lib/api-utils";
import { SourceAttributionSection } from "./sections/SourceAttributionSection";
import { ClinicalInformationSection } from "./sections/ClinicalInformationSection";
import { AdditionalInformationSection } from "./sections/AdditionalInformationSection";
import { useNutrientDepletionAnalysis } from "./hooks/useNutrientDepletionAnalysis";

interface InteractionDescriptionProps {
  interaction: InteractionResult;
}

export function InteractionDescription({ interaction }: InteractionDescriptionProps) {
  // Generate a unique identifier for this interaction if id doesn't exist
  const interactionKey = interaction.id || 
    `${interaction.medications[0]}-${interaction.medications[1]}-${interaction.severity}`;
  
  // Get nutrient depletions using the custom hook
  const nutrientDepletions = useNutrientDepletionAnalysis(interaction);

  return (
    <div className="mb-6 space-y-4">
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
