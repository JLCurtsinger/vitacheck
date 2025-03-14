
import { CheckCircle, AlertTriangle, XCircle, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SeverityIndicatorProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidenceScore?: number;
  aiValidated?: boolean;
}

export function SeverityIndicator({ severity, confidenceScore, aiValidated }: SeverityIndicatorProps) {
  const getSeverityColor = (severity: "safe" | "minor" | "moderate" | "severe" | "unknown") => {
    switch (severity) {
      case "safe":
        return "text-green-500";
      case "minor":
        return "text-yellow-400";
      case "moderate":
        return "text-yellow-600";
      case "severe":
        return "text-red-500";
      case "unknown":
        return "text-gray-400";
    }
  };

  const getSeverityIcon = (severity: "safe" | "minor" | "moderate" | "severe" | "unknown") => {
    const className = "h-6 w-6";
    switch (severity) {
      case "safe":
        return <CheckCircle className={className} />;
      case "minor":
        return <AlertTriangle className={`${className} text-yellow-400`} />;
      case "moderate":
        return <AlertTriangle className={className} />;
      case "severe":
        return <XCircle className={className} />;
      case "unknown":
        return <HelpCircle className={className} />;
    }
  };

  const getSeverityText = (severity: "safe" | "minor" | "moderate" | "severe" | "unknown") => {
    switch (severity) {
      case "safe":
        return "Safe to take together";
      case "minor":
        return "Minor interaction possible";
      case "moderate":
        return "Moderate interaction risk";
      case "severe":
        return "Severe interaction risk";
      case "unknown":
        return "Interaction status unknown";
    }
  };

  const getConfidenceLabel = (score?: number) => {
    if (score === undefined) return "";
    
    if (score >= 90) return "Very High Confidence";
    if (score >= 75) return "High Confidence";
    if (score >= 50) return "Medium Confidence";
    if (score >= 25) return "Low Confidence";
    return "Very Low Confidence";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center">
          <span className={getSeverityColor(severity)}>
            {getSeverityIcon(severity)}
          </span>
          
          {confidenceScore !== undefined && (
            <div className="ml-2 flex items-center">
              <div className="h-1.5 w-12 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full", 
                    confidenceScore >= 75 ? "bg-green-500" : 
                    confidenceScore >= 50 ? "bg-yellow-500" : 
                    confidenceScore >= 25 ? "bg-orange-500" : 
                    "bg-red-500"
                  )}
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
              
              {aiValidated && (
                <span className="ml-1 text-xs text-blue-500 font-medium">AI</span>
              )}
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{getSeverityText(severity)}</p>
          {confidenceScore !== undefined && (
            <p className="text-sm">{getConfidenceLabel(confidenceScore)} ({confidenceScore}%)</p>
          )}
          {aiValidated && (
            <p className="text-xs text-blue-500">Validated with AI literature analysis</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
