
import { cn } from "@/lib/utils";
import { SeverityIndicator } from "../SeverityIndicator";
import { CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CombinedHeaderProps {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidenceScore: number;
  medications: string[];
  aiValidated: boolean;
  severityFlag?: '🔴' | '🟡' | '🟢';
}

export function CombinedHeader({ 
  severity, 
  confidenceScore, 
  medications, 
  aiValidated,
  severityFlag
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

  // Get risk text based on severity flag
  const getRiskText = () => {
    if (!severityFlag) return "";
    
    switch (severityFlag) {
      case "🔴": return "High Risk";
      case "🟡": return "Moderate Risk";
      case "🟢": return "No Known Risk";
      default: return "";
    }
  };
  
  // Get badge color based on severity flag
  const getBadgeClass = () => {
    if (!severityFlag) return "";
    
    switch (severityFlag) {
      case "🔴": return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      case "🟡": return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "🟢": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      default: return "";
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
      <div className="flex items-center gap-2">
        {severityFlag && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className={cn("font-medium", getBadgeClass())}>
                  {severityFlag} {getRiskText()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Overall risk assessment based on combined interactions</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {getSeverityIcon()}
      </div>
    </div>
  );
}
