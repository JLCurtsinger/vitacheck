import { InteractionResult, MedicationLookupResult, InteractionSource } from '../types';
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
      description: highRiskCheck.description || "High risk combination detected",
      sources: [{
        name: "VitaCheck Safety Database",
        severity: "severe",
        description: highRiskCheck.description
      }]
    };
  }

  // Always query all APIs regardless of previous results
  const [rxnormResult, suppaiResult, fdaResult] = await Promise.all([
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm'
      ? checkRxNormInteractions(med1Status.id!, med2Status.id!, med1, med2)
      : Promise.resolve(null),
    checkSuppAiInteractions(med1, med2),
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || [])
  ]);

  const sources: InteractionSource[] = [];
  let maxSeverity: "safe" | "minor" | "severe" | "unknown" = "unknown";
  let description = "Insufficient data available - Please consult your healthcare provider.";

  // Collect all sources and determine max severity
  if (rxnormResult) {
    sources.push(...rxnormResult.sources);
    if (rxnormResult.severity === "severe") {
      maxSeverity = "severe";
    } else if (rxnormResult.severity === "minor" && maxSeverity !== "severe") {
      maxSeverity = "minor";
    }
    description = rxnormResult.description;
  }

  if (suppaiResult) {
    sources.push(...suppaiResult.sources);
    if (suppaiResult.severity === "severe") {
      maxSeverity = "severe";
    } else if (suppaiResult.severity === "minor" && maxSeverity !== "severe") {
      maxSeverity = "minor";
    }
    if (maxSeverity === "severe") {
      description = suppaiResult.description;
    }
  }

  if (fdaResult) {
    sources.push(...fdaResult.sources);
    if (fdaResult.severity === "severe") {
      maxSeverity = "severe";
    } else if (fdaResult.severity === "minor" && maxSeverity !== "severe") {
      maxSeverity = "minor";
    }
    if (maxSeverity === "severe") {
      description = fdaResult.description;
    }
  }

  // Check for discrepancies between sources
  if (sources.length > 1) {
    const severities = new Set(sources.map(s => s.severity));
    if (severities.size > 1) {
      description = `Discrepancy detected: Different sources report varying levels of risk. Consult your healthcare provider.`;
      // Always err on the side of caution when sources disagree
      if (severities.has("severe")) {
        maxSeverity = "severe";
      } else if (severities.has("minor")) {
        maxSeverity = "minor";
      }
    }
  }

  // Only mark as safe if we have data from at least one source and all agree it's safe
  if (sources.length > 0 && sources.every(s => s.severity === "safe")) {
    maxSeverity = "safe";
    description = "No known interactions detected in available databases, but always consult your healthcare provider.";
  }

  return {
    medications: [med1, med2],
    severity: maxSeverity,
    description,
    sources: sources.length > 0 ? sources : [{
      name: "No Data Available",
      severity: "unknown",
      description: "Interaction status unknown - Please consult your healthcare provider"
    }]
  };
}