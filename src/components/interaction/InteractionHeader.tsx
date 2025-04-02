
import { Skeleton } from "@/components/ui/skeleton";
import { InteractionResult } from "@/lib/api-utils";
import { SeverityBadge } from "./severity/SeverityBadge";
import { SeverityTitle } from "./severity/SeverityTitle";

interface InteractionHeaderProps {
  interaction: InteractionResult;
  severityFlag?: '🔴' | '🟡' | '🟢';
  isLoading?: boolean;
}

export function InteractionHeader({ 
  interaction,
  severityFlag = '🟡',
  isLoading = false
}: InteractionHeaderProps) {
  const { medications, severity, confidenceScore } = interaction;
  
  // Build the medication names string
  const medsString = Array.isArray(medications) && medications.length > 0
    ? medications.join(' + ')
    : 'Unknown Medications';
  
  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <SeverityTitle severity={severity} medications={medications} />
        
        <div className="flex items-center gap-1 text-sm">
          {/* Show severity badge and flag with optional loading state */}
          {isLoading ? (
            <Skeleton className="h-6 w-14 inline-block" />
          ) : (
            <>
              <SeverityBadge severity={severity} severityFlag={severityFlag} />
              <span className="ml-1 text-lg" aria-hidden="true">
                {severityFlag}
              </span>
            </>
          )}
          
          {/* Show confidence score if available - now as plain text without badge styling */}
          {confidenceScore !== undefined && (
            <span className="text-xs text-gray-500 ml-2">
              (Confidence: {confidenceScore}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
