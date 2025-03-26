
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SeverityBadgeProps {
  severity?: "safe" | "minor" | "moderate" | "severe" | "unknown";
  severityFlag?: '🔴' | '🟡' | '🟢';
}

export function SeverityBadge({ severity, severityFlag }: SeverityBadgeProps) {
  if (!severityFlag && !severity) return null;
  
  // Determine severity flag based on severity if not explicitly provided
  const displayFlag = severityFlag || (
    severity === "severe" ? "🔴" : 
    severity === "moderate" ? "🟡" : 
    severity === "minor" ? "🟡" : 
    severity === "safe" ? "🟢" : "🟡"
  );
  
  // Get risk text based on severity flag
  const getRiskText = () => {
    switch (displayFlag) {
      case "🔴": return "High Risk";
      case "🟡": return "Moderate Risk";
      case "🟢": return "No Known Risk";
      default: return "";
    }
  };
  
  // Get badge color based on severity flag
  const getBadgeClass = () => {
    switch (displayFlag) {
      case "🔴": return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      case "🟡": return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "🟢": return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      default: return "";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={cn("font-medium", getBadgeClass())}>
            {displayFlag} {getRiskText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Risk assessment based on multiple data sources</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
