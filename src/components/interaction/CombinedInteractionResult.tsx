
import { InteractionResult as InteractionResultType } from "@/lib/api/types";
import { useState, useEffect } from "react";
import { processCombinedSeverity } from "@/lib/api/utils/combined-severity-utils";
import { NutrientDepletion, analyzeNutrientDepletions } from "@/lib/api/utils/nutrient-depletion-utils";

// Import refactored components
import { CombinedHeader } from "./combined/CombinedHeader";
import { CombinedSummary } from "./combined/CombinedSummary";
import { CombinedAdvice } from "./combined/CombinedAdvice";
import { CombinedSeverityContainer } from "./combined/CombinedSeverityContainer";
import { SeverityBreakdown } from "./sections/SeverityBreakdown";
import { NutrientDepletions } from "./sections/NutrientDepletions";

interface CombinedInteractionResultProps {
  medications: string[];
  interactions: InteractionResultType[];
}

export function CombinedInteractionResult({ medications, interactions }: CombinedInteractionResultProps) {
  const [combinedResult, setCombinedResult] = useState<{
    severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
    description: string;
    confidenceScore: number;
    sources: InteractionResultType["sources"];
    combinedWarnings: string[];
  } | null>(null);
  
  // State for nutrient depletions
  const [nutrientDepletions, setNutrientDepletions] = useState<NutrientDepletion[]>([]);

  // Process the combined severity based on all interactions
  useEffect(() => {
    if (interactions.length > 0) {
      const result = processCombinedSeverity(interactions);
      setCombinedResult(result);
      
      console.log('Combined severity calculated:', {
        severity: result.severity,
        confidenceScore: result.confidenceScore,
        sourcesCount: result.sources.length,
        warnings: result.combinedWarnings
      });
    }
  }, [interactions]);
  
  // Load nutrient depletion data
  useEffect(() => {
    const fetchNutrientDepletions = async () => {
      // Extract FDA warnings from all interactions
      const fdaWarnings: Record<string, string[]> = {};
      
      medications.forEach(med => {
        fdaWarnings[med] = [];
      });
      
      // Collect FDA warnings from all interactions
      interactions.forEach(interaction => {
        interaction.sources.forEach(source => {
          if (source.name === "FDA" && source.description) {
            // Since this is a combined view, add warnings to the related medications
            interaction.medications.forEach(med => {
              if (medications.includes(med) && !fdaWarnings[med].includes(source.description)) {
                fdaWarnings[med].push(source.description);
              }
            });
          }
        });
      });
      
      const depletions = await analyzeNutrientDepletions(medications, fdaWarnings);
      setNutrientDepletions(depletions);
    };
    
    if (medications && medications.length > 0) {
      fetchNutrientDepletions();
    }
  }, [medications, interactions]);

  if (!combinedResult) {
    return <div className="p-6">Processing combined interaction data...</div>;
  }

  return (
    <CombinedSeverityContainer severity={combinedResult.severity}>
      <CombinedHeader
        severity={combinedResult.severity}
        confidenceScore={combinedResult.confidenceScore}
        medications={medications}
        aiValidated={interactions.some(i => i.aiValidated)}
      />

      <CombinedSummary
        severity={combinedResult.severity}
        description={combinedResult.description}
        warnings={combinedResult.combinedWarnings}
      />

      <SeverityBreakdown 
        sources={combinedResult.sources}
        confidenceScore={combinedResult.confidenceScore}
      />

      <NutrientDepletions depletions={nutrientDepletions} />

      <CombinedAdvice severity={combinedResult.severity} />
    </CombinedSeverityContainer>
  );
}
