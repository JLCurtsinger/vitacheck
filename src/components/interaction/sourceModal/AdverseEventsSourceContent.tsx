
import React from "react";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { SeverityConfidenceSection } from "./SeverityConfidenceSection";
import { AdverseEventsSection } from "./AdverseEventsSection";
import { DetailsSection } from "./DetailsSection";

interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface AdverseEventsSourceContentProps {
  data: SourceData[];
}

export function AdverseEventsSourceContent({ data }: AdverseEventsSourceContentProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available for this source.</p>
      </div>
    );
  }

  return (
    <>
      <SeverityConfidenceSection data={data} />
      
      {data[0]?.adverseEvents && (
        <AdverseEventsSection adverseEvents={data[0].adverseEvents} />
      )}
      
      <DetailsSection data={data} />
    </>
  );
}
