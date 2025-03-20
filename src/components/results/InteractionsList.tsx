
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionResult } from "../interaction/InteractionResult";
import { ErrorMessage } from "../interaction/ErrorMessage";
import { useEffect } from "react";

interface InteractionsListProps {
  interactions: InteractionResultType[];
  hasAnyInteraction: boolean;
}

export function InteractionsList({ interactions, hasAnyInteraction }: InteractionsListProps) {
  // Enhanced logging for debugging confidence scores
  useEffect(() => {
    console.log('InteractionsList rendering with:', {
      interactionsCount: interactions.length,
      hasAnyInteraction,
      confidenceScores: interactions.map(int => ({
        meds: int.medications.join('+'),
        confidenceScore: int.confidenceScore
      }))
    });
  }, [interactions, hasAnyInteraction]);
  
  if (interactions.length === 0) {
    return (
      <ErrorMessage
        title="No Medications to Compare"
        description="Please select at least two medications to check for interactions."
      />
    );
  }
  
  if (!hasAnyInteraction) {
    return (
      <ErrorMessage
        title="No Interactions Found"
        description="No information found for this combination. Consult a healthcare provider for more details."
      />
    );
  }
  
  return (
    <div className="space-y-8 mb-12">
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
