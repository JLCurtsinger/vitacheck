
import { ErrorMessage } from "@/components/interaction/ErrorMessage";

export function SafeInteractionsMessage() {
  return (
    <ErrorMessage
      title="No Known Interactions"
      description="No known interactions were found for this combination. However, always consult a healthcare provider before combining medications."
    />
  );
}
