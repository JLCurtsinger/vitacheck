
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SeverityBadgeProps {
  severityFlag?: '🔴' | '🟡' | '🟢';
}

export function SeverityBadge({ severityFlag }: SeverityBadgeProps) {
  if (!severityFlag) return null;
  
  // Get risk text based on severity flag
  const getRiskText = () => {
    switch (severityFlag) {
      case "🔴": return "High Risk";
      case "🟡": return "Moderate Risk";
      case "🟢": return "No Known Risk";
      default: return "";
    }
  };
  
  // Get badge color based on severity flag
  const getBadgeClass = () => {
    switch (severityFlag) {
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
            {severityFlag} {getRiskText()}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Risk assessment based on multiple data sources</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
