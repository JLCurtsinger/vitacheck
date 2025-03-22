
import { InteractionResult as InteractionResultType } from "@/lib/api/types";
import { useState, useEffect } from "react";
import { SeverityIndicator } from "./SeverityIndicator";
import { cn } from "@/lib/utils";
import { SeverityBreakdown } from "./sections/SeverityBreakdown";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { processCombinedSeverity } from "@/lib/api/utils/combined-severity-utils";

interface CombinedInteractionResultProps {
  medications: string[];
  interactions: InteractionResultType[];
}

export function CombinedInteractionResult({ medications, interactions }: CombinedInteractionResultProps) {
  const [combinedResult, setCombinedResult] = useState<{
    severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
    description: string;
    confidenceScore: number;
    sources: InteractionResultType["sources"];
    combinedWarnings: string[];
  } | null>(null);

  // Process the combined severity based on all interactions
  useEffect(() => {
    if (interactions.length > 0) {
      const result = processCombinedSeverity(interactions);
      setCombinedResult(result);
      
      console.log('Combined severity calculated:', {
        severity: result.severity,
        confidenceScore: result.confidenceScore,
        sourcesCount: result.sources.length,
        warnings: result.combinedWarnings
      });
    }
  }, [interactions]);

  if (!combinedResult) {
    return <div className="p-6">Processing combined interaction data...</div>;
  }

  const severityColorMap = {
    "severe": "border-red-200 bg-red-50/30",
    "moderate": "border-yellow-300 bg-yellow-50/40",
    "minor": "border-yellow-200 bg-yellow-50/30",
    "unknown": "border-gray-200",
    "safe": "border-green-200 bg-green-50/30"
  };

  const getSeverityIcon = () => {
    switch (combinedResult.severity) {
      case "severe":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "minor":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "unknown":
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityClass = () => {
    switch (combinedResult.severity) {
      case "severe":
        return "text-red-600";
      case "moderate":
        return "text-yellow-600";
      case "minor":
        return "text-yellow-500";
      case "safe":
        return "text-green-600";
      case "unknown":
      default:
        return "text-gray-600";
    }
  };

  const getSeverityTitle = () => {
    const medicationNames = medications.join(" + ");
    
    switch (combinedResult.severity) {
      case "severe":
        return `🚨 Severe Interaction Risk: ${medicationNames}`;
      case "moderate":
        return `⚠️ Moderate Interaction Risk: ${medicationNames}`;
      case "minor":
        return `ℹ️ Minor Interaction Risk: ${medicationNames}`;
      case "safe":
        return `✅ Safe Combination: ${medicationNames}`;
      case "unknown":
      default:
        return `ℹ️ Unknown Interaction Risk: ${medicationNames}`;
    }
  };

  return (
    <div className={cn(
      "p-6 transition-transform hover:scale-[1.01]",
      severityColorMap[combinedResult.severity]
    )}>
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b">
        <div className="flex items-center gap-2">
          <SeverityIndicator 
            severity={combinedResult.severity} 
            confidenceScore={combinedResult.confidenceScore}
            aiValidated={interactions.some(i => i.aiValidated)}
          />
          <h4 className={cn("font-semibold text-lg", getSeverityClass())}>
            {getSeverityTitle()}
          </h4>
        </div>
        {getSeverityIcon()}
      </div>

      {/* Combined Interaction Summary */}
      <div className={cn(
        "p-4 mb-6 rounded-lg border",
        combinedResult.severity === "severe" ? "bg-red-50/60 border-red-200" : 
        combinedResult.severity === "moderate" ? "bg-yellow-50/70 border-yellow-300" :
        combinedResult.severity === "minor" ? "bg-yellow-50/60 border-yellow-200" : 
        combinedResult.severity === "safe" ? "bg-green-50/60 border-green-200" : 
        "bg-gray-50/60 border-gray-200"
      )}>
        <h3 className={cn(
          "text-base font-semibold mb-3 pb-2 border-b flex items-center gap-2",
          combinedResult.severity === "severe" ? "text-red-700 border-red-200" : 
          combinedResult.severity === "moderate" ? "text-yellow-700 border-yellow-300" :
          combinedResult.severity === "minor" ? "text-yellow-600 border-yellow-200" : 
          combinedResult.severity === "safe" ? "text-green-700 border-green-200" : 
          "text-gray-700 border-gray-200"
        )}>
          Combined Interaction Analysis
        </h3>
        
        <div className="space-y-3">
          <p className="text-gray-800">
            {combinedResult.description}
          </p>
          
          {combinedResult.combinedWarnings.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-800">Key Warnings:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {combinedResult.combinedWarnings.map((warning, index) => (
                  <li key={index} className="text-gray-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Severity Breakdown */}
      <SeverityBreakdown 
        sources={combinedResult.sources}
        confidenceScore={combinedResult.confidenceScore}
      />

      {/* Advice Section */}
      <div className="mt-6">
        <div className={cn(
          "p-3 rounded-lg text-sm font-medium",
          combinedResult.severity === "severe" ? "bg-red-50/60 text-red-700" : 
          combinedResult.severity === "moderate" || combinedResult.severity === "minor" ? "bg-yellow-50/60 text-yellow-700" : 
          "bg-gray-50/60 text-gray-700"
        )}>
          {combinedResult.severity === "unknown"
            ? "Insufficient data available about all these medications together. Review individual interactions and consult your healthcare provider."
            : combinedResult.severity === "severe"
            ? "DO NOT take all these medications together without explicit approval from your healthcare provider."
            : combinedResult.severity === "moderate" || combinedResult.severity === "minor" 
            ? "Use caution when taking all these medications together. Monitor for side effects and consult your healthcare provider if concerned."
            : "No significant interactions detected when taking all these medications together. As always, follow prescription directions."}
        </div>
      </div>
    </div>
  );
}
