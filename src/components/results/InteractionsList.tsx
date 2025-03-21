
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionResult } from "../interaction/InteractionResult";
import { ErrorMessage } from "../interaction/ErrorMessage";
import { useEffect } from "react";

interface InteractionsListProps {
  interactions: InteractionResultType[];
  hasAnyInteraction?: boolean;
  medications?: string[]; // Add medications prop to match how it's being used
}

export function InteractionsList({ interactions, hasAnyInteraction, medications }: InteractionsListProps) {
  // Enhanced logging for debugging confidence scores
  useEffect(() => {
    console.log('InteractionsList rendering with:', {
      interactionsCount: interactions.length,
      hasAnyInteraction,
      medications,
      confidenceScores: interactions.map(int => ({
        meds: int.medications.join('+'),
        confidenceScore: int.confidenceScore
      }))
    });
  }, [interactions, hasAnyInteraction, medications]);
  
  if (interactions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Medications to Compare"
          description="Please select at least two medications to check for interactions."
        />
      </div>
    );
  }
  
  if (!hasAnyInteraction) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Interactions Found"
          description="No information found for this combination. Consult a healthcare provider for more details."
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-8 mb-12 max-w-3xl mx-auto">
      {interactions.map((interaction, index) => {
        // Create a more robust unique key for each interaction
        const interactionKey = `${interaction.medications.join('-')}-${interaction.severity}-${interaction.confidenceScore}-${index}`;
        
        return (
          <InteractionResult 
            key={interactionKey} 
            interaction={interaction} 
          />
        );
      })}
    </div>
  );
}
