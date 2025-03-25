
import { SeverityIndicator } from "./SeverityIndicator";
import { InteractionResult } from "@/lib/api-utils";
import { SeverityBadge } from "./severity/SeverityBadge";
import { SeverityIcon } from "./severity/SeverityIcon";
import { SeverityTitle } from "./severity/SeverityTitle";

interface InteractionHeaderProps {
  interaction: InteractionResult;
  severityFlag?: '🔴' | '🟡' | '🟢';
}

export function InteractionHeader({ interaction, severityFlag }: InteractionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b">
      <div className="flex items-center gap-2">
        <SeverityIndicator 
          severity={interaction.severity} 
          confidenceScore={interaction.confidenceScore}
          aiValidated={interaction.aiValidated}
        />
        <SeverityTitle 
          severity={interaction.severity} 
          medications={interaction.medications} 
        />
      </div>
      <div className="flex items-center gap-2">
        <SeverityBadge severityFlag={severityFlag} />
        <SeverityIcon severity={interaction.severity} />
      </div>
    </div>
  );
}
