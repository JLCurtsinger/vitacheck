
import { cn } from "@/lib/utils";
import { SeverityIndicator } from "../SeverityIndicator";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface CombinedHeaderProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidenceScore: number;
  medications: string[];
  aiValidated: boolean;
}

export function CombinedHeader({ 
  severity, 
  confidenceScore, 
  medications, 
  aiValidated 
}: CombinedHeaderProps) {
  const getSeverityIcon = () => {
    switch (severity) {
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
    switch (severity) {
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
    
    switch (severity) {
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
    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b">
      <div className="flex items-center gap-2">
        <SeverityIndicator 
          severity={severity} 
          confidenceScore={confidenceScore}
          aiValidated={aiValidated}
        />
        <h4 className={cn("font-semibold text-lg", getSeverityClass())}>
          {getSeverityTitle()}
        </h4>
      </div>
      {getSeverityIcon()}
    </div>
  );
}
