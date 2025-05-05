
import React from "react";
import { InteractionSource } from "@/lib/api/types";
import { BetaHeader } from "./BetaHeader";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { SeverityConfidenceSection } from "../SeverityConfidenceSection";
import { LiteratureSummary } from "./LiteratureSummary";
import { LiteratureCitations } from "./LiteratureCitations";
import { DetailsSection } from "../DetailsSection";
import { LiteratureSourceFooter } from "./LiteratureSourceFooter";

interface ReliableDataViewProps {
  data: InteractionSource[];
  confidenceScore: number;
  sourcesReferenced: string[];
  bulletPoints: string[];
  citations: string[];
  medications: string[];
  reliability: {
    isReliable: boolean;
    reason?: string;
  };
  clinicianView: boolean;
}

export function ReliableDataView({
  data,
  confidenceScore,
  sourcesReferenced,
  bulletPoints,
  citations,
  medications,
  reliability,
  clinicianView
}: ReliableDataViewProps) {
  return (
    <div className="pb-6">
      {/* Source Metadata with Beta label */}
      <BetaHeader 
        data={data} 
        sourceName="AI Literature Analysis"
        isClinicianView={clinicianView}
      />
      
      {/* Confidence indicator */}
      <ConfidenceIndicator confidenceScore={confidenceScore} />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Literature Analysis Summary */}
      <LiteratureSummary 
        bulletPoints={bulletPoints} 
        sourcesReferenced={sourcesReferenced}
        reliability={reliability}
      />
      
      {/* Citations if available */}
      <LiteratureCitations citations={citations} clinicianView={clinicianView} />
      
      {/* Raw details section */}
      {clinicianView && (
        <DetailsSection data={data} showRaw={true} />
      )}
      
      {/* Source disclaimer and contribution */}
      <LiteratureSourceFooter sourceData={data[0]} />
    </div>
  );
}
