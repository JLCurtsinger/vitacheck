import { getDrugInteractions } from '../rxnorm';
import { getSupplementInteractions } from '../suppai';
import { MedicationLookupResult, InteractionResult, InteractionSource } from '../types';
import { lookupMedication } from './medication-lookup';

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
          sources: [{
            name: "No data available",
            severity: "unknown",
            description: "Medication not found in databases"
          }]
        });
        continue;
      }

      const interactionSources: InteractionSource[] = [];
      let maxSeverity: "safe" | "minor" | "severe" | "unknown" = "safe";
      let description = "";

      // Check interactions based on available sources
      if (med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm') {
        const rxnormInteractions = await getDrugInteractions(med1Status.id!);
        if (rxnormInteractions.length > 0) {
          interactionSources.push({
            name: "RxNorm",
            severity: "minor",
            description: rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || ""
          });
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
        const severity = suppAiInteraction.evidence_count > 5 ? "severe" : "minor";
        interactionSources.push({
          name: "SUPP.AI",
          severity,
          description: suppAiInteraction.label
        });
        if (severity === "severe") {
          maxSeverity = "severe";
        }
        description = description || suppAiInteraction.label;
      }

      // Check FDA warnings if available
      if (med1Status.warnings?.length || med2Status.warnings?.length) {
        const relevantWarnings = [...(med1Status.warnings || []), ...(med2Status.warnings || [])];
        if (relevantWarnings.length > 0) {
          interactionSources.push({
            name: "FDA",
            severity: "severe",
            description: relevantWarnings[0]
          });
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
          sources: [{
            name: "No interactions found in available databases",
            severity: "safe",
            description: "No known interactions detected"
          }]
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