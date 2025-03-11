
import { ExternalLink } from "lucide-react";
import { InteractionResult } from "@/lib/api-utils";
import { cn } from "@/lib/utils";

interface InteractionFooterProps {
  interaction: InteractionResult;
}

export function InteractionFooter({ interaction }: InteractionFooterProps) {
  return (
    <div className="mt-2">
      {interaction.evidence && (
        <a
          href={interaction.evidence}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-3"
        >
          Learn More <ExternalLink className="h-4 w-4" />
        </a>
      )}

      {interaction.severity !== "safe" && (
        <div className={cn(
          "p-3 rounded-lg text-sm font-medium",
          interaction.severity === "severe" ? "bg-red-50/60 text-red-700" : 
          interaction.severity === "minor" ? "bg-yellow-50/60 text-yellow-700" : 
          "bg-gray-50/60 text-gray-700"
        )}>
          {interaction.severity === "unknown"
            ? "Insufficient data available. Please consult your healthcare provider before combining these medications."
            : interaction.severity === "severe"
            ? "DO NOT combine these medications without explicit approval from your healthcare provider."
            : "Monitor for potential side effects and consult your healthcare provider if concerned."}
        </div>
      )}
    </div>
  );
}
