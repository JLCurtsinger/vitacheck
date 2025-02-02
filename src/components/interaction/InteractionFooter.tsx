import { ExternalLink } from "lucide-react";
import { InteractionResult } from "@/lib/api-utils";

interface InteractionFooterProps {
  interaction: InteractionResult;
  finalSeverity: "safe" | "minor" | "severe" | "unknown";
}

export function InteractionFooter({ interaction, finalSeverity }: InteractionFooterProps) {
  return (
    <>
      {interaction.evidence && (
        <a
          href={interaction.evidence}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          Learn More <ExternalLink className="h-4 w-4" />
        </a>
      )}

      {finalSeverity !== "safe" && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            {finalSeverity === "unknown"
              ? "Insufficient data available. Please consult your healthcare provider before combining these medications."
              : finalSeverity === "severe"
              ? "DO NOT combine these medications without explicit approval from your healthcare provider."
              : "Monitor for potential side effects and consult your healthcare provider if concerned."}
          </p>
        </div>
      )}
    </>
  );
}