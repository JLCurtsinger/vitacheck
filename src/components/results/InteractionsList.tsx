import { InteractionResult as InteractionResultType } from "@/lib/api/types";
import { InteractionResult } from "../interaction/InteractionResult";
import { ErrorMessage } from "../interaction/ErrorMessage";
import { useEffect, useState, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CombinedInteractionResult } from "../interaction/CombinedInteractionResult";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractionsListProps {
  interactions: InteractionResultType[];
  hasAnyInteraction?: boolean;
  medications?: string[]; // Add medications prop to match how it's being used
}

export function InteractionsList({ interactions, hasAnyInteraction, medications }: InteractionsListProps) {
  // Add state to track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  // Create stable interaction keys using useMemo
  const interactionKeys = useMemo(() => {
    return interactions.map((interaction, index) => ({
      id: `${interaction.medications.sort().join('-')}-${index}`,
      interaction
    }));
  }, [interactions]);
  
  // Enhanced logging for debugging confidence scores
  useEffect(() => {
    console.log('InteractionsList rendering with:', {
      interactionsCount: interactions.length,
      hasAnyInteraction,
      medications,
      confidenceScores: interactions.map(int => ({
        meds: int.medications.join('+'),
        confidenceScore: int.confidenceScore
      }))
    });
  }, [interactions, hasAnyInteraction, medications]);
  
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
  
  if (!hasAnyInteraction) {
    return (
      <div className="max-w-3xl mx-auto">
        <ErrorMessage
          title="No Interactions Found"
          description="No information found for this combination. Consult a healthcare provider for more details."
        />
      </div>
    );
  }
  
  // Create a combined interaction result if we have more than 2 medications
  const hasCombinedInteraction = medications && medications.length > 2;
  
  return (
    <div className="space-y-8 mb-12 max-w-3xl mx-auto">
      {/* Combined Interaction Section */}
      {hasCombinedInteraction && (
        <Collapsible 
          open={openSections["combined"]} 
          onOpenChange={() => toggleSection("combined")}
          className="rounded-xl bg-white border shadow-lg"
        >
          <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
            <span className="text-lg font-medium">
              🔍 Combined Interaction: {medications.join(' + ')}
            </span>
            <ChevronDown 
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                openSections["combined"] ? "transform rotate-180" : ""
              )} 
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-1">
            <CombinedInteractionResult 
              medications={medications} 
              interactions={interactions}
              key={`combined-${medications.sort().join('-')}`}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Individual Interaction Sections */}
      {interactionKeys.map(({ id, interaction }) => (
        <Collapsible 
          key={id}
          open={openSections[id]} 
          onOpenChange={() => toggleSection(id)}
          className="rounded-xl bg-white border shadow-lg"
        >
          <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
            <span className="text-lg font-medium">
              {interaction.severity === "severe" && "🚨 Severe Interaction: "}
              {interaction.severity === "moderate" && "⚠️ Moderate Interaction: "}
              {interaction.severity === "minor" && "ℹ️ Minor Interaction: "}
              {interaction.severity === "safe" && "✅ Safe Combination: "}
              {interaction.severity === "unknown" && "ℹ️ Unknown Interaction: "}
              {interaction.medications.join(' + ')}
            </span>
            <ChevronDown 
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                openSections[id] ? "transform rotate-180" : ""
              )} 
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-1">
            <InteractionResult 
              interaction={interaction}
              key={id}
            />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
