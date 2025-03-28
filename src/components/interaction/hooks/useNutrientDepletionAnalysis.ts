
import { useState, useEffect } from "react";
import { InteractionResult } from "@/lib/api-utils";
import { NutrientDepletion, analyzeNutrientDepletions } from "@/lib/api/utils/nutrient-depletion-utils";

export function useNutrientDepletionAnalysis(interaction: InteractionResult) {
  const [nutrientDepletions, setNutrientDepletions] = useState<NutrientDepletion[]>([]);
  
  // Load nutrient depletion data
  useEffect(() => {
    const fetchNutrientDepletions = async () => {
      // Extract FDA warnings from sources
      const fdaWarnings: Record<string, string[]> = {};
      
      interaction.medications.forEach(med => {
        fdaWarnings[med] = [];
      });
      
      // Look for FDA warnings in the sources
      interaction.sources.forEach(source => {
        if (source.name === "FDA" && source.description) {
          // For pair interactions, just add to both medications for simplicity
          interaction.medications.forEach(med => {
            fdaWarnings[med].push(source.description);
          });
        }
      });
      
      const depletions = await analyzeNutrientDepletions(interaction.medications, fdaWarnings);
      setNutrientDepletions(depletions);
    };
    
    fetchNutrientDepletions();
  }, [interaction.medications, interaction.sources]);

  return nutrientDepletions;
}
