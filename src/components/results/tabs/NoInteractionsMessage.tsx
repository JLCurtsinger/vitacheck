
import { ErrorMessage } from "@/components/interaction/ErrorMessage";

interface NoInteractionsMessageProps {
  isSingleMedication: boolean;
  medicationName?: string;
}

export function NoInteractionsMessage({ isSingleMedication, medicationName }: NoInteractionsMessageProps) {
  if (isSingleMedication) {
    return (
      <ErrorMessage
        title="No Information Found"
        description={`No specific information found for ${medicationName || "this medication"}. Consult a healthcare provider for details about this medication.`}
      />
    );
  }
  
  return (
    <ErrorMessage
      title="No Interactions Found"
      description="No interaction information found for this combination. This doesn't necessarily mean the combination is safe. Consult a healthcare provider before combining medications."
    />
  );
}
