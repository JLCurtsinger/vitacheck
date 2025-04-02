
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface NoReliableDataAlertProps {
  confidenceScore: number;
}

export function NoReliableDataAlert({ confidenceScore }: NoReliableDataAlertProps) {
  return (
    <div className="p-6">
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-700">No Reliable Data Available</AlertTitle>
        <AlertDescription className="text-amber-800">
          AI Literature Analysis was unable to retrieve reliable data for this combination.
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
