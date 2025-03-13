
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { InteractionHeader } from "./InteractionHeader";
import { InteractionDescription } from "./InteractionDescription";
import { InteractionFooter } from "./InteractionFooter";
import { cn } from "@/lib/utils";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  const severityColorMap = {
    "severe": "border-red-200 bg-red-50/30",
    "minor": "border-yellow-200 bg-yellow-50/30",
    "unknown": "border-gray-200",
    "safe": "border-green-200 bg-green-50/30"
  };

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02] border mb-8",
      severityColorMap[interaction.severity]
    )}>
      <InteractionHeader interaction={interaction} />
      <InteractionDescription interaction={interaction} />
      <InteractionFooter interaction={interaction} />
    </div>
  );
}
