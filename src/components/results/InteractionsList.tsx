
import { InteractionResult } from "@/lib/api-utils";
import { useEffect, useMemo } from "react";
import { useInteractionDisplay } from "./hooks/useInteractionDisplay";
import { InteractionTabs } from "./tabs/InteractionTabs";
import { DefaultInteractionView } from "./DefaultInteractionView";
import { NoMedicationsMessage } from "./tabs/NoMedicationsMessage";
import { NoInteractionsMessage } from "./tabs/NoInteractionsMessage";
import { SafeInteractionsMessage } from "./tabs/SafeInteractionsMessage";

interface InteractionsListProps {
  interactions: InteractionResult[];
  hasAnyInteraction?: boolean;
  medications?: string[];
}

export function InteractionsList({ interactions, hasAnyInteraction, medications }: InteractionsListProps) {
  // Defensive filtering of interactions to prevent runtime errors
  const validInteractions = useMemo(() => 
    interactions?.filter(i => i && i.severity !== undefined && i.sources?.length > 0) || [], 
    [interactions]
  );
  
  // Log diagnostic information about the interactions
  useEffect(() => {
    console.log(`InteractionsList received ${interactions?.length || 0} interactions, ${validInteractions.length} valid`);
    if (interactions?.length !== validInteractions.length) {
      console.warn("Some invalid interactions were filtered out:", 
        interactions?.filter(i => !i || i.severity === undefined || !i.sources || i.sources.length === 0)
      );
    }
  }, [interactions, validInteractions]);
  
  // Get display helpers and state from custom hook
  const {
    activeTab,
    setActiveTab,
    groupedInteractions,
    shouldShowTabs,
    isSingleMedication,
    singleMedicationAdverseEvents,
    hasCombinedInteraction,
    combinedRiskAssessment,
    openSections,
    toggleSection,
    toggleCombinedSection
  } = useInteractionDisplay(medications, validInteractions);

  // Error states with improved messaging
  if (!medications || medications.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <NoMedicationsMessage />
      </div>
    );
  }
  
  if (validInteractions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <NoInteractionsMessage 
          isSingleMedication={isSingleMedication} 
          medicationName={medications?.[0]} 
        />
      </div>
    );
  }
  
  if (!hasAnyInteraction && !singleMedicationAdverseEvents && groupedInteractions.singles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <SafeInteractionsMessage />
      </div>
    );
  }
  
  // Render with tabs if we have different types
  if (shouldShowTabs) {
    return (
      <div className="space-y-8 mb-12 max-w-3xl mx-auto">
        <InteractionTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          groupedInteractions={groupedInteractions}
          hasCombinedInteraction={hasCombinedInteraction}
          medications={medications}
          openSections={openSections}
          toggleSection={toggleSection}
          toggleCombinedSection={toggleCombinedSection}
          singleMedicationAdverseEvents={singleMedicationAdverseEvents}
          isSingleMedication={isSingleMedication}
          combinedRiskAssessment={combinedRiskAssessment}
          validInteractions={validInteractions}
        />
      </div>
    );
  }
  
  // Default view without tabs
  return (
    <DefaultInteractionView
      isSingleMedication={isSingleMedication}
      singleMedicationAdverseEvents={singleMedicationAdverseEvents}
      hasCombinedInteraction={hasCombinedInteraction}
      medications={medications}
      validInteractions={validInteractions}
      openSections={openSections}
      toggleCombinedSection={toggleCombinedSection}
      toggleSection={toggleSection}
      combinedRiskAssessment={combinedRiskAssessment}
    />
  );
}
