
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabPanel } from "./TabPanel";
import { InteractionGroup } from "../InteractionGroup";
import { CombinedInteractionCard } from "../CombinedInteractionCard";
import { SingleMedicationView } from "../SingleMedicationView";
import { InteractionResult } from "@/lib/api-utils";
import { CombinationResult } from "@/lib/api/medication-service";
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";

interface InteractionTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  groupedInteractions: {
    singles: CombinationResult[];
    pairs: CombinationResult[];
    triples: CombinationResult[];
  };
  hasCombinedInteraction: boolean;
  medications?: string[];
  openSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  toggleCombinedSection: () => void;
  singleMedicationAdverseEvents: {
    totalEvents: number;
    reactions: string[];
  } | null;
  isSingleMedication: boolean;
  combinedRiskAssessment: RiskAssessmentOutput | null;
  validInteractions: InteractionResult[];
}

export function InteractionTabs({
  activeTab,
  setActiveTab,
  groupedInteractions,
  hasCombinedInteraction,
  medications,
  openSections,
  toggleSection,
  toggleCombinedSection,
  singleMedicationAdverseEvents,
  isSingleMedication,
  combinedRiskAssessment,
  validInteractions
}: InteractionTabsProps) {
  return (
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
  );
}
