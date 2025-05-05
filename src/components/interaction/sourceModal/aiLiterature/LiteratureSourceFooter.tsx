
import React from "react";
import { getSourceDisclaimer, getSourceContribution } from "../utils";
import { InteractionSource } from "@/lib/api/types";

interface LiteratureSourceFooterProps {
  sourceData: InteractionSource;
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

export function LiteratureSourceFooter({ sourceData, otherSources }: LiteratureSourceFooterProps) {
  return (
    <>
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("AI LITERATURE ANALYSIS")} This source uses AI to analyze medical literature and may not reflect official guidance.
      </div>
      
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(sourceData)}
      </div>

      {otherSources && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          <p className="font-medium mb-1">Other Data Available:</p>
          <ul className="list-disc pl-5 space-y-1">
            {otherSources.rxnorm && (
              <li>RxNorm drug interaction database</li>
            )}
            {otherSources.fda && (
              <li>FDA medication warnings</li>
            )}
            {otherSources.suppai && (
              <li>SUPP.AI supplement interaction database</li>
            )}
            {otherSources.adverseEvents && (
              <li>
                OpenFDA reports {otherSources.adverseEvents.count} adverse events 
                {otherSources.adverseEvents.serious > 0 && ` (including ${otherSources.adverseEvents.serious} serious)`}
              </li>
            )}
          </ul>
        </div>
      )}
    </>
  );
}
