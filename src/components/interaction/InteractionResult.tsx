import { ExternalLink } from "lucide-react";
import { SeverityIndicator } from "./SeverityIndicator";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02]">
      <div className="flex items-center gap-2 mb-2">
        <SeverityIndicator severity={interaction.severity} />
        <h4 className="font-semibold text-lg">
          {interaction.medications[0]} + {interaction.medications[1]}
        </h4>
      </div>
      
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500 mb-1">
          Severity: <span className={`text-${
            interaction.severity === 'safe' ? 'green' : 
            interaction.severity === 'minor' ? 'yellow' : 
            interaction.severity === 'severe' ? 'red' : 
            'gray'}-500`}>
            {interaction.severity === 'safe' ? 'Safe to take together' : 
             interaction.severity === 'minor' ? 'Minor interaction possible' : 
             interaction.severity === 'severe' ? 'Severe interaction risk' :
             'Interaction status unknown'}
          </span>
        </p>
        <SourceAttribution sources={interaction.sources} />
        <p className="text-gray-600">{interaction.description}</p>
      </div>

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
      
      {interaction.severity !== "safe" && interaction.severity !== "unknown" && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Recommendation: {interaction.severity === "severe" 
              ? "Consult your healthcare provider before combining these medications."
              : "Monitor for potential side effects and consult your healthcare provider if concerned."
            }
          </p>
        </div>
      )}

      {interaction.severity === "unknown" && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Recommendation: One or more medications were not found in our databases. Please consult your healthcare provider for guidance.
          </p>
        </div>
      )}
    </div>
  );
}