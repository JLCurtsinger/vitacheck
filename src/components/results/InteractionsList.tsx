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
  
  // Group interactions by type
  const groupedInteractions = useMemo(() => {
    // Check if interactions have the "type" property
    const hasTypes = interactions.length > 0 && 'type' in interactions[0];
    
    if (hasTypes) {
      const typed = interactions as CombinationResult[];
      return {
        singles: typed.filter(i => i.type === 'single'),
        pairs: typed.filter(i => i.type === 'pair'),
        triples: typed.filter(i => i.type === 'triple')
      };
    }
    
    // Default behavior (backward compatibility)
    return {
      singles: [],
      pairs: interactions,
      triples: []
    };
  }, [interactions]);
  
  // Determine if we should show tabs based on the presence of multiple types
  const shouldShowTabs = useMemo(() => {
    return groupedInteractions.singles.length > 0 && 
           (groupedInteractions.pairs.length > 0 || groupedInteractions.triples.length > 0);
  }, [groupedInteractions]);
  
  // Create stable interaction keys
  const interactionKeys = useMemo(() => {
    return interactions.map((interaction, index) => {
      const label = 'label' in interaction ? (interaction as CombinationResult).label : interaction.medications.join('+');
      return {
        id: `${interaction.medications.sort().join('-')}-${index}`,
        interaction,
        label
      };
    });
  }, [interactions]);
  
  // Fetch nutrient depletions for all medications combined
  const { depletions: allMedicationsDepletions } = useNutrientDepletions(
    medications || [], 
    interactions
  );
  
  // Check if this is a single medication search
  const isSingleMedication = medications && medications.length === 1;
  
  // Get adverse events data for single medication if available
  const singleMedicationAdverseEvents = useMemo(() => {
    if (!isSingleMedication || interactions.length === 0) return null;
    
    // Find any source with eventData
    const eventData = interactions[0]?.sources?.find(source => 
      source.eventData && source.eventData.totalEvents > 0
    )?.eventData;
    
    if (!eventData || !eventData.totalEvents) return null;
    
    return {
      totalEvents: eventData.totalEvents,
      reactions: eventData.commonReactions || []
    };
  }, [isSingleMedication, interactions]);
  
  // Is this a combined interaction (more than 2 medications)
  const hasCombinedInteraction = medications && medications.length > 2;
  
  // Combined risk assessment
  const combinedRiskAssessment = useMemo(() => 
    getCombinedRiskAssessment(medications, interactions), 
    [medications, interactions]
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

  // Error states
  if (interactions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Medications to Compare"
          description="Please select at least two medications to check for interactions."
        />
      </div>
    );
  }
  
  if (!hasAnyInteraction && !singleMedicationAdverseEvents && groupedInteractions.singles.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Interactions Found"
          description="No information found for this combination. Consult a healthcare provider for more details."
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
                interactions={interactions}
                isOpen={openSections["combined"]}
                onToggle={toggleCombinedSection}
                risk={combinedRiskAssessment}
              />
            )}
            
            {/* All Interactions */}
            <InteractionGroup 
              interactions={interactions}
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
          interactions={interactions}
          isOpen={openSections["combined"]}
          onToggle={toggleCombinedSection}
          risk={combinedRiskAssessment}
        />
      )}
      
      {/* Individual Interactions */}
      <InteractionGroup 
        interactions={interactions}
        openSections={openSections}
        toggleSection={toggleSection}
        groupName="default"
      />
    </div>
  );
}
