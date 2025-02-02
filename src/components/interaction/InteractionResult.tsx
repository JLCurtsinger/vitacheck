import { ExternalLink } from "lucide-react";
import { SeverityIndicator } from "./SeverityIndicator";
import { SourceAttribution } from "./SourceAttribution";
import { InteractionResult as InteractionResultType } from "@/lib/api-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface InteractionResultProps {
  interaction: InteractionResultType;
}

export function InteractionResult({ interaction }: InteractionResultProps) {
  // Determine final severity based on highest reported severity
  const determineSeverity = (interaction: InteractionResultType): "safe" | "minor" | "severe" | "unknown" => {
    // If any source indicates severe, prioritize that
    if (interaction.sources.some(source => source.severity === "severe")) {
      return "severe";
    }
    
    // If any source indicates unknown, mark as unknown to err on side of caution
    if (interaction.sources.some(source => source.severity === "unknown")) {
      return "unknown";
    }
    
    // If any source indicates minor, prioritize that over safe
    if (interaction.sources.some(source => source.severity === "minor")) {
      return "minor";
    }
    
    // Only if all sources indicate safe and we have at least one source, return safe
    if (interaction.sources.length > 0 && 
        interaction.sources.every(source => source.severity === "safe")) {
      return "safe";
    }
    
    // Default to unknown if we can't determine severity
    return "unknown";
  };

  const finalSeverity = determineSeverity(interaction);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 transition-transform hover:scale-[1.02]">
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
      
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500 mb-1">
          Severity: <span className={`text-${
            finalSeverity === 'safe' ? 'green' : 
            finalSeverity === 'minor' ? 'yellow' : 
            finalSeverity === 'severe' ? 'red' : 
            'gray'}-500`}>
            {finalSeverity === 'safe' ? 'Safe to take together' : 
             finalSeverity === 'minor' ? 'Minor interaction possible' : 
             finalSeverity === 'severe' ? 'Severe interaction risk' :
             'Interaction status unknown'}
          </span>
        </p>
        <SourceAttribution sources={interaction.sources.map(s => s.name)} />
        
        {finalSeverity === "severe" && (
          <Alert variant="destructive" className="mt-2 mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {interaction.description}
            </AlertDescription>
          </Alert>
        )}
        
        {finalSeverity !== "severe" && (
          <p className="text-gray-600">{interaction.description}</p>
        )}
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
      
      {finalSeverity !== "safe" && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            {finalSeverity === "unknown" 
              ? "Insufficient data available. Please consult your healthcare provider before combining these medications."
              : finalSeverity === "severe" 
                ? "DO NOT combine these medications without explicit approval from your healthcare provider."
                : "Monitor for potential side effects and consult your healthcare provider if concerned."
            }
          </p>
        </div>
      )}
    </div>
  );
}