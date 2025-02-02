import { getRxCUI, getDrugInteractions } from './rxnorm';
import { getSupplementInteractions } from './suppai';
import { getFDAWarnings } from './fda';
import { MedicationLookupResult, InteractionResult } from './types';

export async function lookupMedication(medication: string): Promise<MedicationLookupResult> {
  // Try RxNorm first
  try {
    const rxCUI = await getRxCUI(medication);
    if (rxCUI) {
      return { found: true, source: 'RxNorm', id: rxCUI };
    }
  } catch (error) {
    console.error('RxNorm lookup failed:', error);
  }

  // Try SUPP.AI next
  try {
    const suppAiResult = await getSupplementInteractions(medication);
    if (suppAiResult && suppAiResult.length > 0) {
      return { found: true, source: 'SUPP.AI' };
    }
  } catch (error) {
    console.error('SUPP.AI lookup failed:', error);
  }

  // Try FDA as last resort
  try {
    const fdaResult = await getFDAWarnings(medication);
    if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
      return {
        found: true,
        source: 'FDA',
        warnings: fdaResult.results[0].drug_interactions || []
      };
    }
  } catch (error) {
    console.error('FDA lookup failed:', error);
  }

  // If all lookups fail
  return { found: false };
}

export async function checkInteractions(medications: string[]): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  const processedPairs = new Set<string>();
  const medicationStatuses = new Map<string, MedicationLookupResult>();

  // First, lookup all medications
  for (const med of medications) {
    medicationStatuses.set(med, await lookupMedication(med));
  }

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];
      const pairKey = [med1, med2].sort().join('-');
      
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const med1Status = medicationStatuses.get(med1)!;
      const med2Status = medicationStatuses.get(med2)!;

      // If either medication is not found, return unknown status
      if (!med1Status.found || !med2Status.found) {
        results.push({
          medications: [med1, med2],
          severity: "unknown",
          description: `One or more medications not found in available databases. Please consult a healthcare provider.`,
          sources: ["No data available"]
        });
        continue;
      }

      const interactionSources: string[] = [];
      let maxSeverity: "safe" | "minor" | "severe" | "unknown" = "safe";
      let description = "";

      // Check interactions based on available sources
      if (med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm') {
        const rxnormInteractions = await getDrugInteractions(med1Status.id!);
        if (rxnormInteractions.length > 0) {
          interactionSources.push("RxNorm");
          maxSeverity = "minor";
          description = rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || "";
        }
      }

      // Check SUPP.AI
      const suppAiResults = await getSupplementInteractions(med1);
      const suppAiInteraction = suppAiResults.find(
        int => int.drug1.toLowerCase() === med2.toLowerCase() || int.drug2.toLowerCase() === med2.toLowerCase()
      );

      if (suppAiInteraction) {
        interactionSources.push("SUPP.AI");
        if (suppAiInteraction.evidence_count > 5) {
          maxSeverity = "severe";
        }
        description = description || suppAiInteraction.label;
      }

      // Check FDA warnings if available
      if (med1Status.warnings?.length || med2Status.warnings?.length) {
        interactionSources.push("FDA");
        const relevantWarnings = [...(med1Status.warnings || []), ...(med2Status.warnings || [])];
        if (relevantWarnings.length > 0) {
          maxSeverity = "severe";
          description = description || relevantWarnings[0];
        }
      }

      // If no interactions found but medications exist in databases
      if (interactionSources.length === 0) {
        results.push({
          medications: [med1, med2],
          severity: "safe",
          description: "No known interactions detected, but consult a healthcare professional for advice.",
          sources: ["No interactions found in available databases"]
        });
        continue;
      }

      results.push({
        medications: [med1, med2],
        severity: maxSeverity,
        description,
        sources: interactionSources
      });
    }
  }

  return results;
}