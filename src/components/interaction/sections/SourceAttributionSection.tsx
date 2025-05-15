
import { InteractionResult } from "@/lib/api-utils";
import { SourceAttribution } from "../SourceAttribution";

interface SourceAttributionSectionProps {
  interaction: InteractionResult;
}

export function SourceAttributionSection({ interaction }: SourceAttributionSectionProps) {
  // Get unique source names to display
  const sourceNames = Array.from(
    new Set(
      interaction.sources.map(s => typeof s === 'string' ? s : s.name)
    )
  ).filter(name => 
    name !== "No Data Available" && name !== "Unknown"
  );
  
  // Add adverse events source if available
  if (interaction.adverseEvents && interaction.adverseEvents.eventCount > 0) {
    if (!sourceNames.includes("OpenFDA Adverse Events")) {
      sourceNames.push("OpenFDA Adverse Events");
    }
  }
  
  if (sourceNames.length === 0) return null;
  
  return <SourceAttribution sources={sourceNames} interaction={interaction as any} />;
}
