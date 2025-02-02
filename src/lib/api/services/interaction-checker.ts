import { MedicationLookupResult, InteractionResult } from '../types';
import { lookupMedication } from './medication-lookup';
import { checkRxNormInteractions } from './interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from './interactions/suppai-interactions';
import { checkFDAInteractions } from './interactions/fda-interactions';

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

      let interactionSources = [];
      let maxSeverity: "safe" | "minor" | "severe" | "unknown" = "safe";
      let description = "";

      // Check RxNorm interactions
      if (med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm') {
        const rxnormResult = await checkRxNormInteractions(
          med1Status.id!,
          med2Status.id!,
          med1,
          med2
        );
        interactionSources.push(...rxnormResult.sources);
        if (rxnormResult.severity !== "safe") {
          maxSeverity = rxnormResult.severity;
          description = rxnormResult.description;
        }
      }

      // Check SUPP.AI interactions
      const suppAiResult = await checkSuppAiInteractions(med1, med2);
      if (suppAiResult) {
        interactionSources.push(...suppAiResult.sources);
        if (suppAiResult.severity === "severe" || 
            (suppAiResult.severity === "minor" && maxSeverity === "safe")) {
          maxSeverity = suppAiResult.severity;
          description = suppAiResult.description;
        }
      }

      // Check FDA warnings
      const fdaResult = checkFDAInteractions(
        med1Status.warnings || [],
        med2Status.warnings || []
      );
      if (fdaResult) {
        interactionSources.push(...fdaResult.sources);
        maxSeverity = "severe";
        description = fdaResult.description;
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