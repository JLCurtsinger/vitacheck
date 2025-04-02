
import React from "react";
import { InteractionSource } from "@/lib/api/types";
import { SourceMetadataSection } from "./SourceMetadataSection";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { DetailsSection } from "./DetailsSection";
import { getSourceDisclaimer, getSourceContribution } from "./utils";
import { AlertTriangle } from "lucide-react";

interface DefaultSourceContentProps {
  data: InteractionSource[];
  sourceName: string;
  clinicianView?: boolean;
}

export function DefaultSourceContent({ 
  data, 
  sourceName,
  clinicianView = false
}: DefaultSourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available for this source.</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Source Metadata */}
      <SourceMetadataSection 
        data={data} 
        sourceName={sourceName} 
        isClinicianView={clinicianView} 
      />
      
      {/* Severity and confidence information */}
      <SeverityConfidenceSection 
        data={data} 
        clinicianView={clinicianView} 
      />
      
      {/* Basic description */}
      <div className="rounded-md border mb-4 p-4">
        <h3 className="font-medium mb-2">Information Summary</h3>
        <p className="text-sm text-gray-700">
          {data[0]?.description || "No detailed description available."}
        </p>
      </div>
      
      {/* Alert for custom source */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-700">
          This is a custom or non-standard data source. The information presented may not follow standard formatting rules.
          {clinicianView && (
            <span className="block mt-1 text-xs">
              Detailed technical data is available in the Raw Data section below.
            </span>
          )}
        </div>
      </div>
      
      {/* Raw details section */}
      <DetailsSection data={data} showRaw={clinicianView} />
      
      {/* Source disclaimer */}
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer(sourceName) || `Information from ${sourceName} is one of several sources analyzed.`}
      </div>
      
      {/* Contribution to severity score */}
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(data[0])}
      </div>
    </div>
  );
}
