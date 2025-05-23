import { SingleMedicationAdverseEvents } from "../interaction/sections/SingleMedicationAdverseEvents";

interface SingleMedicationViewProps {
  totalEvents: number;
  reactions: string[];
  source?: string;
  sourceUrl?: string;
}

export function SingleMedicationView({ 
  totalEvents, 
  reactions,
  source,
  sourceUrl
}: SingleMedicationViewProps) {
  if (!totalEvents || !reactions || reactions.length === 0) {
    return null;
  }
  
  return (
    <SingleMedicationAdverseEvents 
      totalEvents={totalEvents}
      reactions={reactions}
      source={source}
      sourceUrl={sourceUrl}
    />
  );
}
