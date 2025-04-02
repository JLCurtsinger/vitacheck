
import React from "react";
import { Info } from "lucide-react";

interface ConfidenceIndicatorProps {
  confidenceScore: number;
}

export function ConfidenceIndicator({ confidenceScore }: ConfidenceIndicatorProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Info className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium">
        Confidence: {confidenceScore}%
        {confidenceScore >= 80 && <span className="text-green-600 ml-1">(High)</span>}
        {confidenceScore >= 60 && confidenceScore < 80 && <span className="text-amber-600 ml-1">(Moderate)</span>}
      </span>
    </div>
  );
}
