
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface NoReliableDataAlertProps {
  confidenceScore: number;
  errorType?: "rate_limit" | "service_unavailable" | "abstract_parsing" | "unknown";
  abstractsFound?: boolean;
  otherSourcesAvailable?: boolean;
}

export function NoReliableDataAlert({ 
  confidenceScore, 
  errorType = "unknown",
  abstractsFound = false,
  otherSourcesAvailable = false
}: NoReliableDataAlertProps) {
  // Determine which message to show based on the error type
  const getMessage = () => {
    if (abstractsFound) {
      return "Articles were found, but we were unable to summarize them automatically. You may review available FDA data or consult a healthcare professional for more insights.";
    }
    
    if (errorType === "rate_limit") {
      return "Our AI literature tool has reached its request limit and cannot summarize this interaction right now. Please try again later.";
    }
    
    if (errorType === "service_unavailable") {
      return "Our AI literature tool was temporarily unavailable and could not summarize this interaction. However, other sources may still provide useful information.";
    }
    
    // Default message
    return `AI Literature Analysis was unable to retrieve reliable data for this combination.${
      otherSourcesAvailable 
        ? " Please check other available sources for information." 
        : ""
    }`;
  };

  return (
    <div className="p-6">
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        {errorType === "service_unavailable" || errorType === "rate_limit" ? (
          <AlertTriangle className="h-4 w-4 text-amber-700" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-700" />
        )}
        
        <AlertTitle className="text-amber-700 flex items-center gap-1">
          No Reliable Data Available
          {(errorType === "service_unavailable" || errorType === "rate_limit") && (
            <span className="text-amber-600 text-xs bg-amber-100 px-1 py-0.5 rounded-sm">⚠️ Service Issue</span>
          )}
        </AlertTitle>
        
        <AlertDescription className="text-amber-800">
          {getMessage()}
          {confidenceScore > 0 && confidenceScore < 60 && (
            <span className="block mt-2 text-xs">
              (Confidence score: {confidenceScore}% - below threshold of 60%)
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
