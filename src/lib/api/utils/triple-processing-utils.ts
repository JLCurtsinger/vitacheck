
/**
 * Triple Processing Utilities
 * 
 * Handles processing triple medication combinations to analyze for interactions
 */

import { InteractionResult, MedicationLookupResult } from '../types';
import { processMedicationPair } from './pair-processing-utils';

/**
 * Process a triple of medications to determine potential interactions
 * 
 * This analysis is based on analyzing all pairs within the triple and combining their results
 * 
 * @param med1 First medication
 * @param med2 Second medication
 * @param med3 Third medication
 * @param medicationStatuses Map of medication lookup results
 * @returns Processed interaction result for the triple
 */
export async function processMedicationTriple(
  med1: string,
  med2: string,
  med3: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  // Check all pairs within the triple
  const pair1Result = await processMedicationPair(med1, med2, medicationStatuses);
  const pair2Result = await processMedicationPair(med1, med3, medicationStatuses);
  const pair3Result = await processMedicationPair(med2, med3, medicationStatuses);
  
  // Aggregate all sources
  const allSources = [
    ...pair1Result.sources,
    ...pair2Result.sources,
    ...pair3Result.sources
  ];
  
  // Determine the most severe interaction among the pairs
  const severityOrder = {
    "severe": 0,
    "moderate": 1,
    "minor": 2,
    "unknown": 3,
    "safe": 4
  };
  
  const pairResults = [pair1Result, pair2Result, pair3Result];
  
  // Sort by severity (most severe first)
  pairResults.sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  // Take the most severe result as the base
  const mostSevereResult = pairResults[0];
  
  // Calculate a combined confidence score (average of all pairs)
  let combinedConfidence = 0;
  let confCount = 0;
  
  for (const result of pairResults) {
    if (result.confidenceScore !== undefined) {
      combinedConfidence += result.confidenceScore;
      confCount++;
    }
  }
  
  const finalConfidence = confCount > 0 ? Math.round(combinedConfidence / confCount) : undefined;
  
  // Generate a description that mentions all interactions
  let description = `Analysis of triple combination: ${med1}, ${med2}, and ${med3}. `;
  
  if (mostSevereResult.severity === "severe" || mostSevereResult.severity === "moderate") {
    description += `Caution: This combination includes a ${mostSevereResult.severity} interaction.`;
  } else if (mostSevereResult.severity === "minor") {
    description += `This combination includes a minor interaction that may require monitoring.`;
  } else if (mostSevereResult.severity === "safe") {
    description += `No significant interactions detected between these medications.`;
  } else {
    description += `Insufficient data to fully evaluate this triple combination.`;
  }
  
  return {
    medications: [med1, med2, med3],
    severity: mostSevereResult.severity,
    description,
    sources: allSources,
    confidenceScore: finalConfidence,
    aiValidated: pair1Result.aiValidated || pair2Result.aiValidated || pair3Result.aiValidated
  };
}
