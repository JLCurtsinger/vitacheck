
import { CombinedInteractionCard } from "./CombinedInteractionCard";
import { InteractionGroup } from "./InteractionGroup";
import { SingleMedicationView } from "./SingleMedicationView";
import { InteractionResult } from "@/lib/api-utils";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

interface DefaultInteractionViewProps {
  isSingleMedication: boolean;
  singleMedicationAdverseEvents: {
    totalEvents: number;
    reactions: string[];
  } | null;
  hasCombinedInteraction: boolean;
  medications?: string[];
  validInteractions: InteractionResult[];
  openSections: Record<string, boolean>;
  toggleCombinedSection: () => void;
  toggleSection: (key: string) => void;
  combinedRiskAssessment: RiskAssessmentOutput | null;
}

export function DefaultInteractionView({
  isSingleMedication,
  singleMedicationAdverseEvents,
  hasCombinedInteraction,
  medications,
  validInteractions,
  openSections,
  toggleCombinedSection,
  toggleSection,
  combinedRiskAssessment
}: DefaultInteractionViewProps) {
  return (
    <div className="space-y-8 mb-12 max-w-3xl mx-auto">
      {/* Single Medication View */}
      {isSingleMedication && singleMedicationAdverseEvents && (
        <SingleMedicationView 
          totalEvents={singleMedicationAdverseEvents.totalEvents}
          reactions={singleMedicationAdverseEvents.reactions}
        />
      )}

      {/* Combined Interaction */}
      {hasCombinedInteraction && (
        <CombinedInteractionCard 
          medications={medications || []}
          interactions={validInteractions}
          isOpen={openSections["combined"]}
          onToggle={toggleCombinedSection}
          risk={combinedRiskAssessment}
        />
      )}
      
      {/* Individual Interactions */}
      <InteractionGroup 
        interactions={validInteractions}
        openSections={openSections}
        toggleSection={toggleSection}
        groupName="default"
      />
    </div>
  );
}
