import { InteractionResult as InteractionResultType } from "@/lib/api/types";
import { CombinationResult } from "@/lib/api/services/combination-checker";
import { InteractionResult } from "../interaction/InteractionResult";
import { ErrorMessage } from "../interaction/ErrorMessage";
import { useEffect, useState, useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CombinedInteractionResult } from "../interaction/CombinedInteractionResult";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNutrientDepletions } from "@/hooks/use-nutrient-depletions";
import { SingleMedicationAdverseEvents } from "../interaction/sections/SingleMedicationAdverseEvents";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prepareRiskAssessment } from "@/lib/utils/risk-assessment";
import { Badge } from "@/components/ui/badge";

interface InteractionsListProps {
  interactions: InteractionResultType[];
  hasAnyInteraction?: boolean;
  medications?: string[];
}

export function InteractionsList({ interactions, hasAnyInteraction, medications }: InteractionsListProps) {
  // Add state to track which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  // Use a default tab if there are different combination types
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
  
  // Create stable interaction keys using useMemo
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
  
  // Enhanced logging for debugging
  useEffect(() => {
    console.log('InteractionsList rendering with:', {
      interactionsCount: interactions.length,
      singleCount: groupedInteractions.singles.length,
      pairCount: groupedInteractions.pairs.length,
      tripleCount: groupedInteractions.triples.length,
      hasAnyInteraction,
      medications
    });
  }, [interactions, hasAnyInteraction, medications, groupedInteractions]);
  
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
  
  // Create a combined interaction result if we have more than 2 medications
  const hasCombinedInteraction = medications && medications.length > 2;
  
  // Function to get risk assessment for an interaction
  const getRiskAssessment = (interaction: InteractionResultType) => {
    return prepareRiskAssessment({
      severity: interaction.severity === "severe" ? "severe" : 
                interaction.severity === "moderate" ? "moderate" : "mild",
      fdaReports: { 
        signal: interaction.sources.some(s => s.name === "FDA" && s.severity !== "safe"), 
        count: interaction.sources.find(s => s.name === "FDA")?.eventData?.totalEvents
      },
      openFDA: { 
        signal: interaction.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe"),
        count: interaction.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents  
      },
      suppAI: { 
        signal: interaction.sources.some(s => s.name.includes("AI") && s.severity !== "safe") 
      },
      mechanism: { 
        plausible: interaction.sources.some(s => s.name.includes("Mechanism") && s.severity !== "safe") 
      },
      aiLiterature: { 
        plausible: interaction.sources.some(s => s.name.includes("Literature") && s.severity !== "safe") 
      },
      peerReports: { 
        signal: interaction.sources.some(s => s.name.includes("Report") && s.severity !== "safe") 
      }
    });
  };
  
  // Get badge color based on severity flag
  const getBadgeClass = (severityFlag: '🔴' | '🟡' | '🟢') => {
    switch (severityFlag) {
      case "🔴": return "bg-red-100 text-red-800 border-red-200";
      case "🟡": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "🟢": return "bg-green-100 text-green-800 border-green-200";
      default: return "";
    }
  };
  
  // Get risk text based on severity flag
  const getRiskText = (severityFlag: '🔴' | '🟡' | '🟢') => {
    switch (severityFlag) {
      case "🔴": return "High Risk";
      case "🟡": return "Moderate Risk";
      case "🟢": return "No Known Risk";
      default: return "";
    }
  };

  // Create a combined risk assessment for all medications
  const combinedRiskAssessment = useMemo(() => {
    if (!medications || medications.length <= 1 || interactions.length === 0) {
      return null;
    }
    
    return prepareRiskAssessment({
      severity: interactions.some(i => i.severity === "severe") ? "severe" : 
                interactions.some(i => i.severity === "moderate") ? "moderate" : "mild",
      fdaReports: { 
        signal: interactions.some(i => 
          i.sources.some(s => s.name === "FDA" && s.severity !== "safe")
        ), 
        count: interactions.reduce((total, i) => 
          total + (i.sources.find(s => s.name === "FDA")?.eventData?.totalEvents || 0), 0)
      },
      openFDA: { 
        signal: interactions.some(i => 
          i.sources.some(s => s.name === "OpenFDA Adverse Events" && s.severity !== "safe")
        ),
        count: interactions.reduce((total, i) => 
          total + (i.sources.find(s => s.name === "OpenFDA Adverse Events")?.eventData?.totalEvents || 0), 0)
      },
      suppAI: { 
        signal: interactions.some(i =>
          i.sources.some(s => s.name.includes("AI") && s.severity !== "safe")
        ) 
      },
      mechanism: { 
        plausible: interactions.some(i =>
          i.sources.some(s => s.name.includes("Mechanism") && s.severity !== "safe")
        ) 
      },
      aiLiterature: { 
        plausible: interactions.some(i =>
          i.sources.some(s => s.name.includes("Literature") && s.severity !== "safe")
        ) 
      },
      peerReports: { 
        signal: interactions.some(i =>
          i.sources.some(s => s.name.includes("Report") && s.severity !== "safe")
        ) 
      }
    });
  }, [medications, interactions]);
  
  // Render the interactions grouped by type if we have type information
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
          <TabsContent value="all" className="space-y-6 mt-6">
            {/* Single Medication Adverse Events Section */}
            {isSingleMedication && singleMedicationAdverseEvents && (
              <SingleMedicationAdverseEvents 
                totalEvents={singleMedicationAdverseEvents.totalEvents}
                reactions={singleMedicationAdverseEvents.reactions}
              />
            )}

            {/* Combined Interaction Section */}
            {hasCombinedInteraction && (
              <Collapsible 
                open={openSections["combined"]} 
                onOpenChange={() => toggleSection("combined")}
                className="rounded-xl bg-white border shadow-lg"
              >
                <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
                  <span className="text-lg font-medium flex items-center gap-2">
                    🔍 Combined Interaction: {medications?.join(' + ')}
                    {combinedRiskAssessment && (
                      <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(combinedRiskAssessment.severityFlag))}>
                        {combinedRiskAssessment.severityFlag} {getRiskText(combinedRiskAssessment.severityFlag)}
                      </Badge>
                    )}
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
                    medications={medications || []} 
                    interactions={interactions}
                    key={`combined-${medications?.sort().join('-')}`}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* All Interaction Sections */}
            {interactionKeys.map(({ id, interaction, label }) => {
              const risk = getRiskAssessment(interaction);
              return (
                <Collapsible 
                  key={id}
                  open={openSections[id]} 
                  onOpenChange={() => toggleSection(id)}
                  className="rounded-xl bg-white border shadow-lg"
                >
                  <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
                    <span className="text-lg font-medium flex items-center gap-2">
                      {interaction.severity === "severe" && "🚨 Severe: "}
                      {interaction.severity === "moderate" && "⚠️ Moderate: "}
                      {interaction.severity === "minor" && "ℹ️ Minor: "}
                      {interaction.severity === "safe" && "✅ Safe: "}
                      {interaction.severity === "unknown" && "ℹ️ Unknown: "}
                      {label}
                      
                      {risk && (
                        <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
                          {risk.severityFlag} {getRiskText(risk.severityFlag)}
                        </Badge>
                      )}
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
              );
            })}
          </TabsContent>
          
          {/* Singles Tab */}
          <TabsContent value="singles" className="space-y-6 mt-6">
            {groupedInteractions.singles.length === 0 ? (
              <div className="p-6 bg-white rounded-xl shadow border">
                <p className="text-center text-gray-500">No individual medication information available.</p>
              </div>
            ) : (
              groupedInteractions.singles.map((interaction, index) => {
                const id = `single-${interaction.medications.join('-')}-${index}`;
                const label = 'label' in interaction ? (interaction as CombinationResult).label : interaction.medications.join('+');
                const risk = getRiskAssessment(interaction);
                
                return (
                  <Collapsible 
                    key={id}
                    open={openSections[id] !== false} 
                    onOpenChange={() => toggleSection(id)}
                    className="rounded-xl bg-white border shadow-lg"
                  >
                    <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
                      <span className="text-lg font-medium flex items-center gap-2">
                        {'🔍 Individual: '}{label}
                        {risk && (
                          <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
                            {risk.severityFlag} {getRiskText(risk.severityFlag)}
                          </Badge>
                        )}
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
                );
              })
            )}
          </TabsContent>
          
          {/* Pairs Tab */}
          <TabsContent value="pairs" className="space-y-6 mt-6">
            {groupedInteractions.pairs.length === 0 ? (
              <div className="p-6 bg-white rounded-xl shadow border">
                <p className="text-center text-gray-500">No medication pair interactions available.</p>
              </div>
            ) : (
              groupedInteractions.pairs.map((interaction, index) => {
                const id = `pair-${interaction.medications.join('-')}-${index}`;
                const label = 'label' in interaction ? (interaction as CombinationResult).label : interaction.medications.join(' + ');
                const risk = getRiskAssessment(interaction);
                
                return (
                  <Collapsible 
                    key={id}
                    open={openSections[id] !== false} 
                    onOpenChange={() => toggleSection(id)}
                    className="rounded-xl bg-white border shadow-lg"
                  >
                    <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
                      <span className="text-lg font-medium flex items-center gap-2">
                        {interaction.severity === "severe" && "🚨 Severe: "}
                        {interaction.severity === "moderate" && "⚠️ Moderate: "}
                        {interaction.severity === "minor" && "ℹ️ Minor: "}
                        {interaction.severity === "safe" && "✅ Safe: "}
                        {interaction.severity === "unknown" && "ℹ️ Unknown: "}
                        {label}
                        {risk && (
                          <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
                            {risk.severityFlag} {getRiskText(risk.severityFlag)}
                          </Badge>
                        )}
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
                );
              })
            )}
          </TabsContent>
          
          {/* Triples Tab */}
          <TabsContent value="triples" className="space-y-6 mt-6">
            {groupedInteractions.triples.length === 0 ? (
              <div className="p-6 bg-white rounded-xl shadow border">
                <p className="text-center text-gray-500">No triple medication combinations analyzed.</p>
                {medications && medications.length >= 3 && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Triple analysis is optional and may be limited for performance reasons.
                  </p>
                )}
              </div>
            ) : (
              groupedInteractions.triples.map((interaction, index) => {
                const id = `triple-${interaction.medications.join('-')}-${index}`;
                const label = 'label' in interaction ? (interaction as CombinationResult).label : interaction.medications.join(' + ');
                const risk = getRiskAssessment(interaction);
                
                return (
                  <Collapsible 
                    key={id}
                    open={openSections[id] !== false} 
                    onOpenChange={() => toggleSection(id)}
                    className="rounded-xl bg-white border shadow-lg"
                  >
                    <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
                      <span className="text-lg font-medium flex items-center gap-2">
                        {interaction.severity === "severe" && "🚨 Severe: "}
                        {interaction.severity === "moderate" && "⚠️ Moderate: "}
                        {interaction.severity === "minor" && "ℹ️ Minor: "}
                        {interaction.severity === "safe" && "✅ Safe: "}
                        {interaction.severity === "unknown" && "ℹ️ Unknown: "}
                        {label}
                        {risk && (
                          <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
                            {risk.severityFlag} {getRiskText(risk.severityFlag)}
                          </Badge>
                        )}
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
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  // Default view for backward compatibility or when no type grouping is needed
  return (
    <div className="space-y-8 mb-12 max-w-3xl mx-auto">
      {/* Single Medication Adverse Events Section */}
      {isSingleMedication && singleMedicationAdverseEvents && (
        <SingleMedicationAdverseEvents 
          totalEvents={singleMedicationAdverseEvents.totalEvents}
          reactions={singleMedicationAdverseEvents.reactions}
        />
      )}

      {/* Combined Interaction Section */}
      {hasCombinedInteraction && (
        <Collapsible 
          open={openSections["combined"]} 
          onOpenChange={() => toggleSection("combined")}
          className="rounded-xl bg-white border shadow-lg"
        >
          <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
            <span className="text-lg font-medium flex items-center gap-2">
              🔍 Combined Interaction: {medications?.join(' + ')}
              {combinedRiskAssessment && (
                <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(combinedRiskAssessment.severityFlag))}>
                  {combinedRiskAssessment.severityFlag} {getRiskText(combinedRiskAssessment.severityFlag)}
                </Badge>
              )}
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
              medications={medications || []} 
              interactions={interactions}
              key={`combined-${medications?.sort().join('-')}`}
            />
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Individual Interaction Sections */}
      {interactionKeys.map(({ id, interaction, label }) => {
        const risk = getRiskAssessment(interaction);
        return (
          <Collapsible 
            key={id}
            open={openSections[id]} 
            onOpenChange={() => toggleSection(id)}
            className="rounded-xl bg-white border shadow-lg"
          >
            <CollapsibleTrigger className="flex w-full justify-between items-center p-4 rounded-t-xl hover:bg-gray-50">
              <span className="text-lg font-medium flex items-center gap-2">
                {interaction.severity === "severe" && "🚨 Severe: "}
                {interaction.severity === "moderate" && "⚠️ Moderate: "}
                {interaction.severity === "minor" && "ℹ️ Minor: "}
                {interaction.severity === "safe" && "✅ Safe: "}
                {interaction.severity === "unknown" && "ℹ️ Unknown: "}
                {label}
                
                {risk && (
                  <Badge variant="outline" className={cn("ml-2 font-medium text-sm", getBadgeClass(risk.severityFlag))}>
                    {risk.severityFlag} {getRiskText(risk.severityFlag)}
                  </Badge>
                )}
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
        );
      })}
    </div>
  );
}
