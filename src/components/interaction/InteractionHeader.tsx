
import { InteractionResult } from "@/lib/api-utils";

interface InteractionHeaderProps {
  interaction: InteractionResult;
  severityFlag?: '🔴' | '🟡' | '🟢';
}

export function InteractionHeader({ interaction, severityFlag }: InteractionHeaderProps) {
  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "severe": return "Severe Interaction";
      case "moderate": return "Moderate Interaction";
      case "minor": return "Minor Interaction";
      case "unknown": return "Unknown Interaction Risk";
      case "safe": return "No Known Interaction";
      default: return "";
    }
  };

  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {severityFlag && <span>{severityFlag}</span>}
        {getSeverityText(interaction.severity)}
      </h2>
      <p className="text-gray-600 mt-1">
        {interaction.medications.join(' + ')}
      </p>
    </div>
  );
}
