
import { SingleMedicationAdverseEvents } from "../interaction/sections/SingleMedicationAdverseEvents";

interface SingleMedicationViewProps {
  totalEvents: number;
  reactions: string[];
}

export function SingleMedicationView({ totalEvents, reactions }: SingleMedicationViewProps) {
  if (!totalEvents || !reactions || reactions.length === 0) {
    return null;
  }
  
  return (
    <SingleMedicationAdverseEvents 
      totalEvents={totalEvents}
      reactions={reactions}
    />
  );
}
