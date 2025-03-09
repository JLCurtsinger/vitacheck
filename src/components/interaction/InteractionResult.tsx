
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const determineSeverity = (
    interaction: InteractionResultType
  ): "safe" | "minor" | "severe" | "unknown" => {
    // Check for adverse events first
    if (interaction.adverseEvents?.seriousCount > 0) {
      return "severe";
    }
    
    if (interaction.adverseEvents?.eventCount > 5) {
      return "minor";
    }

    if (interaction.sources.some((source) => source.severity === "severe")) {
      return "severe";
    }

    if (interaction.sources.some((source) => source.severity === "unknown")) {
      return "unknown";
    }

    if (interaction.sources.some((source) => source.severity === "minor")) {
      return "minor";
    }

    if (
      interaction.sources.length > 0 &&
      interaction.sources.every((source) => source.severity === "safe")
    ) {
      return "safe";
    }

    return "unknown";
  };

  const finalSeverity = determineSeverity(interaction);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02]">
      <InteractionHeader interaction={interaction} finalSeverity={finalSeverity} />
      <InteractionDescription interaction={interaction} finalSeverity={finalSeverity} />
      <InteractionFooter interaction={interaction} finalSeverity={finalSeverity} />
    </div>
  );
}
