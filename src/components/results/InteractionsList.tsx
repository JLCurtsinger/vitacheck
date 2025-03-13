
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionResult } from "../interaction/InteractionResult";
import { ErrorMessage } from "../interaction/ErrorMessage";

interface InteractionsListProps {
  interactions: InteractionResultType[];
  hasAnyInteraction: boolean;
}

export function InteractionsList({ interactions, hasAnyInteraction }: InteractionsListProps) {
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
    <div className="space-y-8 mb-8">
      {interactions.map((interaction, index) => (
        <InteractionResult key={index} interaction={interaction} />
      ))}
    </div>
  );
}
