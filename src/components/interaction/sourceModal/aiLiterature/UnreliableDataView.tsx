
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
  // Extract error information from the data for better user feedback
  const errorInfo = React.useMemo(() => {
    const errorMessages = data
      .filter(item => item.errorMessage || item.fallbackReason)
      .map(item => item.errorMessage || item.fallbackReason)
      .filter(Boolean) as string[];
    
    const hasRateLimitError = errorMessages.some(msg => 
      msg.toLowerCase().includes('rate limit') || 
      msg.toLowerCase().includes('429') || 
      msg.toLowerCase().includes('too many requests')
    );
    
    const hasServiceError = errorMessages.some(msg =>
      msg.toLowerCase().includes('service unavailable') ||
      msg.toLowerCase().includes('503') ||
      msg.toLowerCase().includes('500') ||
      msg.toLowerCase().includes('error occurred')
    );
    
    const hasAbstractsButNoSummary = data.some(item => 
      item.pubMedIds && 
      item.pubMedIds.length > 0 && 
      (!item.description || item.description.length < 20)
    );
    
    let errorType: "rate_limit" | "service_unavailable" | "abstract_parsing" | "unknown" = "unknown";
    
    if (hasRateLimitError) {
      errorType = "rate_limit";
    } else if (hasServiceError) {
      errorType = "service_unavailable";
    } else if (hasAbstractsButNoSummary) {
      errorType = "abstract_parsing";
    }
    
    console.log('[AI Literature Modal] Fallback triggered – response:', { 
      description: data[0]?.description,
      confidence: confidenceScore,
      severity: data[0]?.severity,
      errorType,
      errorMessages
    });
    
    return {
      errorType,
      abstractsFound: hasAbstractsButNoSummary || data.some(item => item.pubMedIds && item.pubMedIds.length > 0),
      otherSourcesAvailable: sourcesReferenced.length > 0
    };
  }, [data, confidenceScore, sourcesReferenced]);
  
  // For clinician view, show unreliable data with warning banner
  if (clinicianView) {
    return (
      <div className="pb-6">
        <BetaHeader 
          data={data}
          sourceName="AI Literature Analysis"
          isClinicianView={true}
          hasError={!!errorInfo.errorType && errorInfo.errorType !== "unknown"}
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
  
  // For regular users, show the no reliable data alert with enhanced error information
  return (
    <NoReliableDataAlert 
      confidenceScore={confidenceScore} 
      errorType={errorInfo.errorType}
      abstractsFound={errorInfo.abstractsFound}
      otherSourcesAvailable={errorInfo.otherSourcesAvailable}
    />
  );
}
