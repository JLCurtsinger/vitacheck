import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SingleMedicationAdverseEventsProps {
  totalEvents: number;
  reactions: string[];
  source?: string;
  sourceUrl?: string;
}

export function SingleMedicationAdverseEvents({ 
  totalEvents, 
  reactions,
  source,
  sourceUrl
}: SingleMedicationAdverseEventsProps) {
  if (!totalEvents || totalEvents === 0 || !reactions || reactions.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Safety Considerations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            No major safety considerations were found in the FDA label for this substance. Always consult your provider.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Safety Considerations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Adverse Event Reports</h4>
            <p className="text-gray-600">
              This substance has been associated with {totalEvents.toLocaleString()} reported adverse events in the FDA database.
            </p>
          </div>
          
          {reactions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Common Reactions</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {reactions.slice(0, 5).map((reaction, index) => (
                  <li key={index}>{reaction}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Source Citation */}
          {(source || sourceUrl) && (
            <div className="mt-4 text-xs text-gray-500">
              Source: {sourceUrl ? (
                <a 
                  href={sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {source || 'OpenFDA Adverse Events Database'}
                </a>
              ) : (
                source || 'OpenFDA Adverse Events Database'
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
