
import { InteractionResult } from "@/lib/api-utils";
import { SeverityBreakdown } from "./SeverityBreakdown";
import { AdverseEvents } from "./AdverseEvents";
import { SafeCombination } from "./SafeCombination";
import { NutrientDepletions } from "./NutrientDepletions";
import { NutrientDepletion } from "@/lib/api/utils/nutrient-depletion-utils";

interface AdditionalInformationSectionProps {
  interaction: InteractionResult;
  nutrientDepletions: NutrientDepletion[];
}

export function AdditionalInformationSection({ 
  interaction, 
  nutrientDepletions 
}: AdditionalInformationSectionProps) {
  // Check if we have adverse event data
  const hasAdverseEvents = interaction.adverseEvents && interaction.adverseEvents.eventCount > 0;

  return (
    <>
      {/* Severity Breakdown Table */}
      <SeverityBreakdown 
        sources={interaction.sources} 
        confidenceScore={interaction.confidenceScore}
        adverseEvents={interaction.adverseEvents}
      />
      
      {/* Adverse Events Section */}
      {hasAdverseEvents && (
        <AdverseEvents adverseEvents={interaction.adverseEvents} />
      )}
      
      {/* Safe Combination with No Adverse Events */}
      <SafeCombination 
        isSafe={interaction.severity === "safe"} 
        hasAdverseEvents={hasAdverseEvents} 
      />
      
      {/* Nutrient Depletions Section */}
      <NutrientDepletions depletions={nutrientDepletions} />
      
      {/* Sources information */}
      {interaction.sources.length > 1 && (
        <div className="mt-2 text-xs text-gray-500">
          <p>This result combines data from multiple medical databases to provide comprehensive information.</p>
        </div>
      )}
    </>
  );
}
