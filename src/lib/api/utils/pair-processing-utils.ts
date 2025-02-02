import { InteractionResult, MedicationLookupResult } from '../types';
import { checkRxNormInteractions } from '../services/interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from '../services/interactions/suppai-interactions';
import { checkFDAInteractions } from '../services/interactions/fda-interactions';
import { checkHighRiskCombination } from './high-risk-interactions';

export function generateMedicationPairs(medications: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const processedPairs = new Set<string>();
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const pair = [medications[i], medications[j]].sort();
      const pairKey = pair.join('-');
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        pairs.push([medications[i], medications[j]]);
      }
    }
  }
  
  return pairs;
}

export async function processMedicationPair(
  med1: string,
  med2: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  const med1Status = medicationStatuses.get(med1)!;
  const med2Status = medicationStatuses.get(med2)!;
  
  // First check for known high-risk combinations
  const highRiskCheck = checkHighRiskCombination(med1, med2);
  if (highRiskCheck.isHighRisk) {
    return {
      medications: [med1, med2],
      severity: "severe",
      description: highRiskCheck.description!,
      sources: [{
        name: "VitaCheck Safety Database",
        severity: "severe",
        description: highRiskCheck.description
      }]
    };
  }

  let interactionSources = [];
  let maxSeverity: "safe" | "minor" | "severe" | "unknown" = "unknown";
  let description = "Insufficient data available - Please consult your healthcare provider before combining these medications.";

  // Check RxNorm interactions if both medications are found
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
        (suppAiResult.severity === "minor" && maxSeverity === "unknown")) {
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
    if (fdaResult.severity === "severe" || 
        (fdaResult.severity === "minor" && maxSeverity === "unknown")) {
      maxSeverity = fdaResult.severity;
      description = fdaResult.description;
    }
  }

  // Only mark as safe if we have data from at least one source and no warnings
  if (interactionSources.length > 0 && maxSeverity === "unknown") {
    maxSeverity = "safe";
    description = "No known interactions detected in available databases, but always consult your healthcare provider before combining medications.";
  }

  return {
    medications: [med1, med2],
    severity: maxSeverity,
    description,
    sources: interactionSources.length > 0 ? interactionSources : [{
      name: "No Data Available",
      severity: "unknown",
      description: "Interaction status unknown - Please consult your healthcare provider"
    }]
  };
}