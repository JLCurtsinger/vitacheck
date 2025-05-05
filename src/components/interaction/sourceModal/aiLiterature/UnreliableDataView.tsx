
import React from "react";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { LiteratureSummary } from "./LiteratureSummary";
import { DetailsSection } from "../DetailsSection";
import { NoReliableDataAlert } from "./NoReliableDataAlert";
import { InteractionSource } from "@/lib/api/types";
import { ReliabilityBanner } from "./ReliabilityBanner";
import { BetaHeader } from "./BetaHeader";

interface UnreliableDataViewProps {
  data: InteractionSource[];
  confidenceScore: number;
  sourcesReferenced: string[];
  bulletPoints: string[];
  reliability: {
    isReliable: boolean;
    reason?: string;
  };
  clinicianView: boolean;
}

export function UnreliableDataView({ 
  data, 
  confidenceScore,
  sourcesReferenced,
  bulletPoints,
  reliability,
  clinicianView
}: UnreliableDataViewProps) {
  // For clinician view, show unreliable data with warning banner
  if (clinicianView) {
    return (
      <div className="pb-6">
        <BetaHeader 
          data={data}
          sourceName="AI Literature Analysis"
          isClinicianView={true}
        />
        
        <ReliabilityBanner message="This AI analysis didn't meet reliability thresholds, but is shown for research purposes." />
        
        <ConfidenceIndicator confidenceScore={confidenceScore} />
        
        <LiteratureSummary 
          bulletPoints={bulletPoints}
          sourcesReferenced={sourcesReferenced}
          reliability={reliability}
        />
        
        <DetailsSection data={data} showRaw={true} />
      </div>
    );
  }
  
  // For regular users, show the no reliable data alert
  return <NoReliableDataAlert confidenceScore={confidenceScore} />;
}
