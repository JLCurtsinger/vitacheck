
import { useState, useEffect } from 'react';
import { NutrientDepletion, analyzeNutrientDepletions } from '@/lib/api/utils/nutrient-depletion-utils';
import { InteractionResult } from '@/lib/api/types';

export function useNutrientDepletions(
  medications: string[], 
  interactions: InteractionResult[]
) {
  const [depletions, setDepletions] = useState<NutrientDepletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchNutrientDepletions() {
      if (!medications || medications.length === 0) {
        setDepletions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Extract FDA warnings from all interactions
        const fdaWarnings: Record<string, string[]> = {};
        
        medications.forEach(med => {
          fdaWarnings[med] = [];
        });
        
        // Look for FDA warnings in the interactions
        interactions.forEach(interaction => {
          interaction.sources.forEach(source => {
            if (source.name === "FDA" && source.description) {
              // For each medication in the interaction, add the FDA warning
              interaction.medications.forEach(med => {
                if (medications.includes(med) && !fdaWarnings[med].includes(source.description)) {
                  fdaWarnings[med].push(source.description);
                }
              });
            }
          });
        });
        
        console.log('FDA warnings extracted for nutrient analysis:', fdaWarnings);
        
        const result = await analyzeNutrientDepletions(medications, fdaWarnings);
        setDepletions(result);
        
        console.log('Nutrient depletions analysis complete:', result);
        
      } catch (err) {
        console.error('Error analyzing nutrient depletions:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchNutrientDepletions();
  }, [medications, interactions]);

  return { depletions, loading, error };
}
