
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface SingleMedicationAdverseEventsProps {
  totalEvents: number;
  reactions: string[];
}

export function SingleMedicationAdverseEvents({ 
  totalEvents, 
  reactions 
}: SingleMedicationAdverseEventsProps) {
  if (!totalEvents || totalEvents === 0 || !reactions || reactions.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-800" />
      <AlertTitle className="text-yellow-800 font-medium">
        ⚠️ This substance has been associated with the following reactions in {totalEvents.toLocaleString()} reports:
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside mt-2 mb-2">
          {reactions.slice(0, 3).map((reaction, index) => (
            <li key={index}>{reaction}</li>
          ))}
        </ul>
        <p className="text-sm text-yellow-700 mt-1">Source: openFDA</p>
      </AlertDescription>
    </Alert>
  );
}
