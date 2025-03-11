
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SeverityIndicator } from "./SeverityIndicator";
import { InteractionResult } from "@/lib/api-utils";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractionHeaderProps {
  interaction: InteractionResult;
}

export function InteractionHeader({ interaction }: InteractionHeaderProps) {
  const getSeverityIcon = () => {
    switch (interaction.severity) {
      case "severe":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "minor":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "safe":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "unknown":
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getSeverityTitle = () => {
    const medicationNames = interaction.medications.join(" + ");
    
    switch (interaction.severity) {
      case "severe":
        return `🚨 Severe Interaction: ${medicationNames}`;
      case "minor":
        return `⚠️ Moderate Interaction: ${medicationNames}`;
      case "safe":
        return `✅ Safe Combination: ${medicationNames}`;
      case "unknown":
      default:
        return `ℹ️ Unknown Interaction: ${medicationNames}`;
    }
  };

  const getSeverityClass = () => {
    switch (interaction.severity) {
      case "severe":
        return "text-red-600";
      case "minor":
        return "text-yellow-600";
      case "safe":
        return "text-green-600";
      case "unknown":
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <SeverityIndicator severity={interaction.severity} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Severity level determined from {interaction.sources.length} source(s)</p>
              {interaction.sources.map((source, index) => (
                <p key={index} className="text-sm">
                  {source.name}: {source.severity}
                </p>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <h4 className={cn("font-semibold text-lg", getSeverityClass())}>
          {getSeverityTitle()}
        </h4>
      </div>
      {getSeverityIcon()}
    </div>
  );
}
