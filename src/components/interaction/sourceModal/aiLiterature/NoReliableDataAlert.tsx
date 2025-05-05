
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface NoReliableDataAlertProps {
  confidenceScore: number;
  otherSources?: {
    rxnorm?: boolean;
    fda?: boolean;
    suppai?: boolean;
    adverseEvents?: {
      count: number;
      serious: number;
    } | null;
  };
}

export function NoReliableDataAlert({ confidenceScore, otherSources }: NoReliableDataAlertProps) {
  const hasOtherSources = otherSources && (
    otherSources.rxnorm || 
    otherSources.fda || 
    otherSources.suppai || 
    otherSources.adverseEvents
  );
  
  return (
    <div className="p-6">
      <Alert variant="default" className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-700" />
        <AlertTitle className="text-amber-700">No Literature Analysis Available</AlertTitle>
        <AlertDescription className="text-amber-800">
          {hasOtherSources ? 
            "AI Literature Analysis could not process this combination, but information is available from other sources." :
            "AI Literature Analysis was unable to retrieve reliable data for this combination."
          }
          
          {confidenceScore > 0 && confidenceScore < 60 && (
            <span className="block mt-2 text-xs">
              (Confidence score: {confidenceScore}% - below threshold of 60%)
            </span>
          )}
        </AlertDescription>
      </Alert>
      
      {hasOtherSources && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-700">
          <p className="font-medium mb-2">Based on other data sources:</p>
          <ul className="list-disc pl-5 space-y-1">
            {otherSources.rxnorm && (
              <li>RxNorm drug interaction database has information about this combination</li>
            )}
            {otherSources.fda && (
              <li>FDA has issued warnings for this combination</li>
            )}
            {otherSources.suppai && (
              <li>SUPP.AI has documented interactions for this combination</li>
            )}
            {otherSources.adverseEvents && otherSources.adverseEvents.count > 0 && (
              <li>
                OpenFDA reports {otherSources.adverseEvents.count} adverse events 
                {otherSources.adverseEvents.serious > 0 && ` (including ${otherSources.adverseEvents.serious} serious)`}
              </li>
            )}
          </ul>
          <p className="mt-3 text-xs italic">
            Click on those source badges to view their detailed information.
          </p>
        </div>
      )}
    </div>
  );
}
