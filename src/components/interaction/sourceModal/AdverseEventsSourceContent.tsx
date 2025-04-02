
import React, { useState } from "react";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { AdverseEventsSection } from "./AdverseEventsSection";
import { DetailsSection } from "./DetailsSection";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";

interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface AdverseEventsSourceContentProps {
  data: SourceData[];
  sourceName: string;
}

export function AdverseEventsSourceContent({ data, sourceName }: AdverseEventsSourceContentProps) {
  const [clinicianView, setClinicianView] = useState(false);
  
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available from this source.</p>
      </div>
    );
  }
  
  // Get adverse event data from the first item if available
  const adverseEvents = data[0]?.adverseEvents;
  
  return (
    <>
      {/* Clinician View Toggle */}
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Label htmlFor="clinician-view" className="text-sm font-medium">
          Clinician View
        </Label>
        <Switch
          id="clinician-view"
          checked={clinicianView}
          onCheckedChange={setClinicianView}
        />
      </div>
      
      {/* Source Metadata */}
      <SourceMetadataSection data={data} sourceName={sourceName} />
      
      {/* Severity and confidence section */}
      <SeverityConfidenceSection data={data} />
      
      {/* Adverse Events Summary */}
      {adverseEvents && (
        <AdverseEventsSection adverseEvents={adverseEvents} />
      )}
      
      {/* Raw Details */}
      <DetailsSection data={data} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
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
    </>
  );
}
