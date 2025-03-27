
import { InteractionResult } from "@/lib/api-utils";
import { CombinationResult } from "@/lib/api/services/interaction-checker";
import { ErrorMessage } from "../interaction/ErrorMessage";
import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNutrientDepletions } from "@/hooks/use-nutrient-depletions";
import { SingleMedicationView } from "./SingleMedicationView";
import { CombinedInteractionCard } from "./CombinedInteractionCard";
import { InteractionGroup } from "./InteractionGroup";
import { TabPanel } from "./tabs/TabPanel";
import { getCombinedRiskAssessment } from "./utils/risk-utils";

interface InteractionsListProps {
  interactions: InteractionResult[];
  hasAnyInteraction?: boolean;
  medications?: string[];
}

export function InteractionsList({ interactions, hasAnyInteraction, medications }: InteractionsListProps) {
  // State for tracking which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<string>("all");
  
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
  
  // Group interactions by type
  const groupedInteractions = useMemo(() => {
    // Check if interactions have the "type" property
    const hasTypes = validInteractions.length > 0 && 'type' in validInteractions[0];
    
    if (hasTypes) {
      const typed = validInteractions as CombinationResult[];
      return {
        singles: typed.filter(i => i.type === 'single'),
        pairs: typed.filter(i => i.type === 'pair'),
        triples: typed.filter(i => i.type === 'triple')
      };
    }
    
    // Default behavior (backward compatibility)
    return {
      singles: [],
      pairs: validInteractions,
      triples: []
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
  
  // Fetch nutrient depletions for all medications combined
  const { depletions: allMedicationsDepletions } = useNutrientDepletions(
    medications || [], 
    validInteractions
  );
  
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

  // Error states with improved messaging
  if (!medications || medications.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Medications Selected"
          description="Please select at least one medication to view information."
        />
      </div>
    );
  }
  
  if (validInteractions.length === 0) {
    // Different message based on number of medications
    if (medications.length === 1) {
      return (
        <div className="max-w-3xl mx-auto">
          <ErrorMessage
            title="No Information Found"
            description={`No specific information found for ${medications[0]}. Consult a healthcare provider for details about this medication.`}
          />
        </div>
      );
    } else {
      return (
        <div className="max-w-3xl mx-auto">
          <ErrorMessage
            title="No Interactions Found"
            description="No interaction information found for this combination. This doesn't necessarily mean the combination is safe. Consult a healthcare provider before combining medications."
          />
        </div>
      );
    }
  }
  
  if (!hasAnyInteraction && !singleMedicationAdverseEvents && groupedInteractions.singles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Known Interactions"
          description="No known interactions were found for this combination. However, always consult a healthcare provider before combining medications."
        />
      </div>
    );
  }
  
  // Render with tabs if we have different types
  if (shouldShowTabs) {
    return (
      <div className="space-y-8 mb-12 max-w-3xl mx-auto">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Results</TabsTrigger>
            {groupedInteractions.singles.length > 0 && (
              <TabsTrigger value="singles">Individual</TabsTrigger>
            )}
            {groupedInteractions.pairs.length > 0 && (
              <TabsTrigger value="pairs">Pairs</TabsTrigger>
            )}
            {groupedInteractions.triples.length > 0 && (
              <TabsTrigger value="triples">Triples</TabsTrigger>
            )}
          </TabsList>
          
          {/* All Results Tab */}
          <TabPanel value="all" activeTab={activeTab}>
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
            
            {/* All Interactions */}
            <InteractionGroup 
              interactions={validInteractions}
              openSections={openSections}
              toggleSection={toggleSection}
              groupName="all"
            />
          </TabPanel>
          
          {/* Singles Tab */}
          <TabPanel value="singles" activeTab={activeTab}>
            <InteractionGroup 
              interactions={groupedInteractions.singles}
              openSections={openSections}
              toggleSection={toggleSection}
              groupName="single"
              emptyMessage="No individual medication information available."
            />
          </TabPanel>
          
          {/* Pairs Tab */}
          <TabPanel value="pairs" activeTab={activeTab}>
            <InteractionGroup 
              interactions={groupedInteractions.pairs}
              openSections={openSections}
              toggleSection={toggleSection}
              groupName="pair"
              emptyMessage="No medication pair interactions available."
            />
          </TabPanel>
          
          {/* Triples Tab */}
          <TabPanel value="triples" activeTab={activeTab}>
            <InteractionGroup 
              interactions={groupedInteractions.triples}
              openSections={openSections}
              toggleSection={toggleSection}
              groupName="triple"
              emptyMessage={
                medications && medications.length >= 3 
                  ? "No triple medication combinations analyzed. Triple analysis is optional and may be limited for performance reasons."
                  : "No triple medication combinations analyzed."
              }
            />
          </TabPanel>
        </Tabs>
      </div>
    );
  }
  
  // Default view without tabs
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
