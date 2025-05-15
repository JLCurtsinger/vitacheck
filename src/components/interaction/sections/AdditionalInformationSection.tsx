
import { InteractionResult } from "@/lib/api-utils";
import { NutrientDepletion } from "@/lib/api/utils/nutrient-depletion-utils";
import { SeverityBreakdown } from "./SeverityBreakdown";
import { AdverseEvents } from "./AdverseEvents";
import { NutrientDepletions } from "./NutrientDepletions";

interface AdditionalInformationSectionProps {
  interaction: InteractionResult;
  nutrientDepletions: NutrientDepletion[];
  hideSeverityBreakdown?: boolean;
}

export function AdditionalInformationSection({ 
  interaction, 
  nutrientDepletions,
  hideSeverityBreakdown = false 
}: AdditionalInformationSectionProps) {
  // Check if we have adverse event data
  const hasAdverseEvents = interaction.adverseEvents && interaction.adverseEvents.eventCount > 0;

  return (
    <div className="space-y-6">
      {/* Severity Breakdown Table - only show for multi-medication interactions */}
      {!hideSeverityBreakdown && (
        <SeverityBreakdown 
          sources={interaction.sources} 
          confidenceScore={interaction.confidenceScore}
          adverseEvents={interaction.adverseEvents}
          medications={interaction.medications}
        />
      )}
      
      {/* Adverse Events Section */}
      {hasAdverseEvents && (
        <AdverseEvents adverseEvents={interaction.adverseEvents!} />
      )}
      
      {/* Nutrient Depletions Section */}
      <NutrientDepletions depletions={nutrientDepletions} />
      
      {/* Sources information */}
      {interaction.sources.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          <p>This result combines data from multiple medical databases to provide comprehensive information.</p>
        </div>
      )}
    </div>
  );
}
