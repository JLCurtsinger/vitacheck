
import React from "react";
import { InteractionSource } from "@/lib/api/types";
import { BetaHeader } from "./BetaHeader";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import { SeverityConfidenceSection } from "../SeverityConfidenceSection";
import { LiteratureSummary } from "./LiteratureSummary";
import { LiteratureCitations } from "./LiteratureCitations";
import { DetailsSection } from "../DetailsSection";
import { LiteratureSourceFooter } from "./LiteratureSourceFooter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
    hasPubMedEvidence?: boolean;
  };
  clinicianView: boolean;
  isFallbackMode?: boolean;
  fallbackInfo?: {
    reason?: string;
    sources?: string[];
  } | null;
}

export function ReliableDataView({
  data,
  confidenceScore,
  sourcesReferenced,
  bulletPoints,
  citations,
  medications,
  reliability,
  clinicianView,
  isFallbackMode = false,
  fallbackInfo = null
}: ReliableDataViewProps) {
  return (
    <div className="pb-6">
      {/* Source Metadata with Beta label */}
      <BetaHeader 
        data={data} 
        sourceName="AI Literature Analysis"
        isClinicianView={clinicianView}
      />
      
      {/* Fallback notice for clinicians */}
      {isFallbackMode && clinicianView && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-800">Fallback Analysis</AlertTitle>
          <AlertDescription className="text-blue-700 text-sm">
            {fallbackInfo?.reason || 'This analysis was generated from other available data sources as a fallback.'}
            {fallbackInfo?.sources && fallbackInfo.sources.length > 0 && (
              <span className="block mt-1">
                Using sources: {fallbackInfo.sources.join(', ')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Direct PubMed evidence indicator for clinicians */}
      {reliability.hasPubMedEvidence && clinicianView && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-700" />
          <AlertTitle className="text-green-800">PubMed Evidence Available</AlertTitle>
          <AlertDescription className="text-green-700 text-sm">
            This analysis includes data from published medical literature retrieved directly from PubMed.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Confidence indicator */}
      <ConfidenceIndicator confidenceScore={confidenceScore} />
      
      {/* Severity and confidence at the top */}
      <SeverityConfidenceSection data={data} clinicianView={clinicianView} />
      
      {/* Literature Analysis Summary */}
      <LiteratureSummary 
        bulletPoints={bulletPoints} 
        sourcesReferenced={sourcesReferenced}
        reliability={reliability}
        isFallback={isFallbackMode}
      />
      
      {/* Citations if available */}
      <LiteratureCitations citations={citations} clinicianView={clinicianView} />
      
      {/* Raw details section */}
      {clinicianView && (
        <DetailsSection data={data} showRaw={true} />
      )}
      
      {/* Source disclaimer and contribution */}
      <LiteratureSourceFooter 
        sourceData={data[0]} 
        isFallback={isFallbackMode}
      />
    </div>
  );
}
