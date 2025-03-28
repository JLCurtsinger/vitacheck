
import { useState, useEffect, useMemo } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { CombinationResult } from "@/lib/api/services/interaction-checker";
import { getCombinedRiskAssessment } from "../utils/risk-utils";

export function useInteractionDisplay(
  medications: string[] | undefined,
  validInteractions: InteractionResult[]
) {
  // State for tracking which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Group interactions by type
  const groupedInteractions = useMemo(() => {
    // Check if interactions have the "type" property
    const hasTypes = validInteractions.length > 0 && 'type' in validInteractions[0];
    
    if (hasTypes) {
      // If the interactions already have types, we can cast them directly
      const typed = validInteractions as CombinationResult[];
      return {
        singles: typed.filter(i => i.type === 'single'),
        pairs: typed.filter(i => i.type === 'pair'),
        triples: typed.filter(i => i.type === 'triple')
      };
    }
    
    // Default behavior (backward compatibility)
    // Convert InteractionResult[] to CombinationResult[] by adding the missing properties
    return {
      singles: [] as CombinationResult[],
      pairs: validInteractions.map(interaction => ({
        ...interaction,
        type: 'pair' as const,
        label: interaction.medications.join(' + ')
      })) as CombinationResult[],
      triples: [] as CombinationResult[]
    };
  }, [validInteractions]);
  
  // Determine if we should show tabs based on the presence of multiple types
  const shouldShowTabs = useMemo(() => {
    return groupedInteractions.singles.length > 0 && 
           (groupedInteractions.pairs.length > 0 || groupedInteractions.triples.length > 0);
  }, [groupedInteractions]);
  
  // Create stable interaction keys
  const interactionKeys = useMemo(() => {
    return validInteractions.map((interaction, index) => {
      const label = 'label' in interaction ? (interaction as CombinationResult).label : interaction.medications.join('+');
      return {
        id: `${interaction.medications.sort().join('-')}-${index}`,
        interaction,
        label
      };
    });
  }, [validInteractions]);
  
  // Check if this is a single medication search
  const isSingleMedication = medications && medications.length === 1;
  
  // Get adverse events data for single medication if available
  const singleMedicationAdverseEvents = useMemo(() => {
    if (!isSingleMedication || validInteractions.length === 0) return null;
    
    // Find any source with eventData
    const eventData = validInteractions[0]?.sources?.find(source => 
      source.eventData && source.eventData.totalEvents > 0
    )?.eventData;
    
    if (!eventData || !eventData.totalEvents) return null;
    
    return {
      totalEvents: eventData.totalEvents,
      reactions: eventData.commonReactions || []
    };
  }, [isSingleMedication, validInteractions]);
  
  // Is this a combined interaction (more than 2 medications)
  const hasCombinedInteraction = medications && medications.length > 2;
  
  // Combined risk assessment
  const combinedRiskAssessment = useMemo(() => 
    getCombinedRiskAssessment(medications, validInteractions), 
    [medications, validInteractions]
  );
  
  useEffect(() => {
    // Set initial open states based on number of interactions
    const initialState: Record<string, boolean> = {};
    
    // If we have a combined interaction, open that by default
    if (medications && medications.length > 2) {
      initialState["combined"] = true;
      
      // Keep individual pairs collapsed by default when combined view is present
      interactionKeys.forEach(({ id }) => {
        initialState[id] = false;
      });
    } else {
      // If no combined interaction, open the first interaction by default
      if (interactionKeys.length > 0) {
        initialState[interactionKeys[0].id] = true;
      }
    }
    
    setOpenSections(initialState);
  }, [interactionKeys, medications]);
  
  // Handler for toggling sections
  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Toggle combined section
  const toggleCombinedSection = () => {
    toggleSection("combined");
  };

  return {
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
  };
}
