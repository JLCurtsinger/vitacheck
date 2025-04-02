
import React from "react";
import { AdverseEventData, InteractionSource } from "@/lib/api/types";
import { AdverseEventsSourceContent } from "./AdverseEventsSourceContent";
import { FDASourceContent } from "./FDASourceContent";
import { AILiteratureSourceContent } from "./AILiteratureSourceContent";
import { DefaultSourceContent } from "./DefaultSourceContent";
import { RxNormSourceContent } from "./RxNormSourceContent";
import { SuppAISourceContent } from "./SuppAISourceContent";

// Extended interface to handle different source-specific data
interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
  // Add other source-specific fields as needed
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
  
  // Route to the appropriate component based on the source name
  const sourceNameUpper = sourceName.toUpperCase();
  
  if (sourceNameUpper.includes("ADVERSE")) {
    return <AdverseEventsSourceContent data={data} sourceName={sourceName} />;
  } else if (sourceNameUpper.includes("FDA")) {
    return <FDASourceContent data={data} medications={medications} sourceName={sourceName} />;
  } else if (sourceNameUpper.includes("RXNORM")) {
    return <RxNormSourceContent data={data} medications={medications} />;
  } else if (sourceNameUpper.includes("SUPP.AI")) {
    return <SuppAISourceContent data={data} medications={medications} />;
  } else if (sourceNameUpper.includes("AI") || sourceNameUpper.includes("LITERATURE")) {
    return <AILiteratureSourceContent data={data} medications={medications} />;
  }
  
  return <DefaultSourceContent data={data} />;
}
