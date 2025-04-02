
import React from "react";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { AdverseEventsSection } from "./AdverseEventsSection";
import { DetailsSection } from "./DetailsSection";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface AdverseEventsSourceContentProps {
  data: SourceData[];
  sourceName: string;
  clinicianView?: boolean;
  medications?: string[];
}

export function AdverseEventsSourceContent({ 
  data, 
  sourceName,
  clinicianView = false,
  medications = []
}: AdverseEventsSourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available from this source.</p>
      </div>
    );
  }
  
  // Get adverse event data from the first item if available
  const adverseEvents = data[0]?.adverseEvents;
  const hasFallbackMode = data[0]?.fallbackMode;
  
  return (
    <div className="pb-6">
      {/* Source Metadata - now with clinicianView prop */}
      <SourceMetadataSection 
        data={data} 
        sourceName={sourceName} 
        isClinicianView={clinicianView}
      />
      
      {/* Display fallback mode message in clinician view */}
      {clinicianView && hasFallbackMode && (
        <Alert className="bg-amber-50 border-amber-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Fallback Processing Applied</AlertTitle>
          <AlertDescription className="text-amber-700 text-sm">
            {data[0]?.fallbackReason || 'This data was processed using fallback logic due to schema inconsistencies.'}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Severity and confidence section */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Adverse Events Summary */}
      {adverseEvents && (
        <AdverseEventsSection 
          adverseEvents={adverseEvents} 
          clinicianView={clinicianView} 
          showFallbackNotice={hasFallbackMode}
        />
      )}
      
      {/* Raw Details - Shown based on clinician view toggle */}
      <DetailsSection data={data} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer(sourceName)}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(
          data[0], 
          adverseEvents?.eventCount, 
          adverseEvents?.seriousCount
        )}
      </div>
    </div>
  );
}
