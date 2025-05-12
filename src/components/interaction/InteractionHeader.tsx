import { Skeleton } from "@/components/ui/skeleton";
import { InteractionResult } from "@/lib/api-utils";
import { SeverityTitle } from "./severity/SeverityTitle";

interface InteractionHeaderProps {
  interaction: InteractionResult;
  severityFlag?: '🔴' | '🟡' | '🟢';
  isLoading?: boolean;
}

export function InteractionHeader({ 
  interaction,
  isLoading = false
}: InteractionHeaderProps) {
  const { medications, severity, confidenceScore } = interaction;
  
  // Check if this is a single medication result
  const isSingleMedication = medications.length === 1;
  
  // Build the medication names string
  const medsString = Array.isArray(medications) && medications.length > 0
    ? medications.join(' + ')
    : 'Unknown Medications';
  
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        {isSingleMedication ? (
          // For single medications, just show the name
          <h4 className="font-semibold text-lg text-gray-900">
            {medsString}
          </h4>
        ) : (
          // For combinations, show severity title
          <SeverityTitle severity={severity} medications={medications} />
        )}
        
        <div className="flex items-center gap-1 text-sm">
          {isLoading ? (
            <Skeleton className="h-6 w-14 inline-block" />
          ) : null}

          {confidenceScore !== undefined && !isSingleMedication && (
            <span className="text-xs text-gray-500 ml-2">
              (Confidence: {confidenceScore}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}