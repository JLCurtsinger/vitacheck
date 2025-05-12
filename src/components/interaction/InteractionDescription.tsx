import { InteractionResult } from "@/lib/api-utils";
import { SourceAttributionSection } from "./sections/SourceAttributionSection";
import { ClinicalInformationSection } from "./sections/ClinicalInformationSection";
import { AdditionalInformationSection } from "./sections/AdditionalInformationSection";
import { useNutrientDepletionAnalysis } from "./hooks/useNutrientDepletionAnalysis";
import { containsMildLanguage } from "@/lib/utils/text-analysis";
import { SeverityDisclaimer } from "./severity/SeverityDisclaimer";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // For single medications, show a neutral safety information card
  if (isSingleMedication) {
    return (
      <div className="mb-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">General Safety Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p>
                {interaction.medications[0]} is a short-acting benzodiazepine commonly used to treat anxiety and panic disorders. 
                Common adverse reactions include drowsiness, fatigue, memory impairment, and dizziness. 
                Risk of respiratory depression is increased when combined with opioids or other CNS depressants. 
                Patients with liver impairment, sleep apnea, or a history of substance abuse may be at higher risk. 
                Avoid combining with grapefruit juice, which can increase blood levels of {interaction.medications[0]}. 
                Consult your healthcare provider before combining {interaction.medications[0]} with any other sedative medications.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Sources Attribution Section */}
        <SourceAttributionSection interaction={interaction} />
        
        {/* Additional Information Section (Adverse Events, etc.) */}
        <AdditionalInformationSection 
          interaction={interaction} 
          nutrientDepletions={nutrientDepletions} 
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
