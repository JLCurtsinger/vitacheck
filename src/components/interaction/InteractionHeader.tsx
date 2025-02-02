import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SeverityIndicator } from "./SeverityIndicator";
import { InteractionResult } from "@/lib/api-utils";

interface InteractionHeaderProps {
  interaction: InteractionResult;
  finalSeverity: "safe" | "minor" | "severe" | "unknown";
}

export function InteractionHeader({ interaction, finalSeverity }: InteractionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <SeverityIndicator severity={finalSeverity} />
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
      <h4 className="font-semibold text-lg">
        {interaction.medications[0]} + {interaction.medications[1]}
      </h4>
    </div>
  );
}