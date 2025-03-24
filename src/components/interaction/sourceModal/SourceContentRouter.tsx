
import React from "react";
import { AdverseEventData, InteractionSource } from "@/lib/api/types";
import { AdverseEventsSourceContent } from "./AdverseEventsSourceContent";
import { FDASourceContent } from "./FDASourceContent";
import { AILiteratureSourceContent } from "./AILiteratureSourceContent";
import { DefaultSourceContent } from "./DefaultSourceContent";

// We need to define a custom type to handle the special case for adverse events
interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface SourceContentRouterProps {
  sourceName: string;
  data: SourceData[];
  medications: string[];
}

export function SourceContentRouter({ sourceName, data, medications }: SourceContentRouterProps) {
  if (data.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No detailed information available for this source.</p>
      </div>
    );
  }
  
  if (sourceName.toUpperCase().includes("ADVERSE")) {
    return <AdverseEventsSourceContent data={data} />;
  } else if (sourceName.toUpperCase().includes("FDA")) {
    return <FDASourceContent data={data} medications={medications} />;
  } else if (sourceName.toUpperCase().includes("AI") || sourceName.toUpperCase().includes("LITERATURE")) {
    return <AILiteratureSourceContent data={data} medications={medications} />;
  }
  
  return <DefaultSourceContent data={data} />;
}
