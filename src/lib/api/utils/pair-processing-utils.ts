
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
  let description = "No interaction data available. Consult your healthcare provider.";
  let hasExplicitSafety = false;
  let hasAdverseReaction = false;

  // Collect all sources and analyze their results
  if (rxnormResult) {
    sources.push(...rxnormResult.sources);
    if (rxnormResult.severity === "safe") hasExplicitSafety = true;
    if (rxnormResult.severity === "minor" || rxnormResult.severity === "severe") hasAdverseReaction = true;
  }

  if (suppaiResult) {
    sources.push(...suppaiResult.sources);
    if (suppaiResult.severity === "safe") hasExplicitSafety = true;
    if (suppaiResult.severity === "minor" || suppaiResult.severity === "severe") hasAdverseReaction = true;
  }

  if (fdaResult) {
    sources.push(...fdaResult.sources);
    if (fdaResult.severity === "safe") hasExplicitSafety = true;
    if (fdaResult.severity === "minor" || fdaResult.severity === "severe") hasAdverseReaction = true;
  }

  // Determine final severity and description based on collected data
  if (hasAdverseReaction) {
    // If any source reports an adverse reaction, use the most severe warning
    if (sources.some(s => s.severity === "severe")) {
      maxSeverity = "severe";
      description = sources.find(s => s.severity === "severe")?.description || 
                   "Severe interaction detected. Consult your healthcare provider.";
    } else {
      maxSeverity = "minor";
      description = sources.find(s => s.severity === "minor")?.description || 
                   "Minor interaction possible. Monitor for side effects.";
    }
  } else if (hasExplicitSafety && !hasAdverseReaction) {
    // Only mark as safe if at least one source explicitly confirms safety and no source reports adverse reactions
    maxSeverity = "safe";
    description = "Verified safe to take together based on available data. Always consult your healthcare provider.";
  } else {
    // If no explicit safety confirmation or adverse reactions found
    maxSeverity = "unknown";
    description = "No interaction data available. Consult your healthcare provider.";
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
