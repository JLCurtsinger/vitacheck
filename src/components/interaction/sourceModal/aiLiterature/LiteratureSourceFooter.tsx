
import React from "react";
import { getSourceDisclaimer, getSourceContribution } from "../utils";
import { InteractionSource } from "@/lib/api/types";

interface LiteratureSourceFooterProps {
  sourceData: InteractionSource;
}

export function LiteratureSourceFooter({ sourceData }: LiteratureSourceFooterProps) {
  return (
    <>
      <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 italic">
        {getSourceDisclaimer("AI LITERATURE ANALYSIS")} This source uses AI to analyze medical literature and may not reflect official guidance.
      </div>
      
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
        {getSourceContribution(sourceData)}
      </div>
    </>
  );
}
