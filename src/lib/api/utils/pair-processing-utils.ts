
/**
 * Medication Pair Processing Utilities
 * 
 * This module handles the core logic for processing medication pairs and determining
 * interaction severity based on multiple data sources. It implements a comprehensive
 * checking system that queries multiple medical databases and aggregates their results.
 * 
 * @module pair-processing-utils
 */

import { InteractionResult, MedicationLookupResult, InteractionSource } from '../types';
import { checkRxNormInteractions } from '../services/interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from '../services/interactions/suppai-interactions';
import { checkFDAInteractions } from '../services/interactions/fda-interactions';
import { checkHighRiskCombination } from './high-risk-interactions';

type Severity = "safe" | "minor" | "severe" | "unknown";

/**
 * Generates all possible unique pairs of medications from an input array
 * @param medications - Array of medication names to generate pairs from
 * @returns Array of medication name pairs
 */
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

/**
 * Processes a pair of medications to determine potential interactions
 * 
 * This function:
 * 1. Queries multiple medical databases (RxNorm, SUPP.AI, FDA)
 * 2. Aggregates and cross-validates the results
 * 3. Determines the final severity rating
 * 4. Handles discrepancies between different data sources
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @param medicationStatuses - Map of medication lookup results
 * @returns Processed interaction result with severity and warnings
 */
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
      severity: "severe" as const,
      description: highRiskCheck.description || "High risk combination detected",
      sources: [{
        name: "VitaCheck Safety Database",
        severity: "severe" as const,
        description: highRiskCheck.description
      }]
    };
  }

  // Query all available databases simultaneously
  const [rxnormResult, suppaiResult, fdaResult] = await Promise.all([
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm'
      ? checkRxNormInteractions(med1Status.id!, med2Status.id!, med1, med2)
      : Promise.resolve(null),
    checkSuppAiInteractions(med1, med2),
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || [])
  ]);

  const sources: InteractionSource[] = [];
  let maxSeverity: Severity = "unknown";
  let description = "Insufficient data available - Please consult your healthcare provider.";

  // Helper function to determine if a severity level should update maxSeverity
  const shouldUpdateMaxSeverity = (currentSeverity: Severity, newSeverity: Severity): boolean => {
    if (newSeverity === "severe") return true;
    if (newSeverity === "minor" && currentSeverity !== "severe") return true;
    if (newSeverity === "safe" && currentSeverity === "unknown") return true;
    return false;
  };

  // Collect all sources and determine max severity
  if (rxnormResult) {
    sources.push(...rxnormResult.sources);
    if (shouldUpdateMaxSeverity(maxSeverity, rxnormResult.severity)) {
      maxSeverity = rxnormResult.severity;
      description = rxnormResult.description;
    }
  }

  if (suppaiResult) {
    sources.push(...suppaiResult.sources);
    if (shouldUpdateMaxSeverity(maxSeverity, suppaiResult.severity)) {
      maxSeverity = suppaiResult.severity;
      if (maxSeverity === "severe") {
        description = suppaiResult.description;
      }
    }
  }

  if (fdaResult) {
    sources.push(...fdaResult.sources);
    if (shouldUpdateMaxSeverity(maxSeverity, fdaResult.severity)) {
      maxSeverity = fdaResult.severity;
      if (maxSeverity === "severe") {
        description = fdaResult.description;
      }
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
      severity: "unknown" as const,
      description: "Interaction status unknown - Please consult your healthcare provider"
    }]
  };
}
