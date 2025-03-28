
import { ErrorMessage } from "@/components/interaction/ErrorMessage";

export function NoMedicationsMessage() {
  return (
    <ErrorMessage
      title="No Medications Selected"
      description="Please select at least one medication to view information."
    />
  );
}
