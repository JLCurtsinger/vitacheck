/**
 * Triple Processing Utilities
 * 
 * Handles processing triple medication combinations to analyze for interactions
 */

import { InteractionResult, MedicationLookupResult } from '../types';
import { processMedicationPair, createFallbackInteractionResult } from './pair-processing';

/**
 * Creates a fallback result for a medication triple
 */
function createFallbackTripleResult(
  med1: string,
  med2: string,
  med3: string,
  customDescription?: string
): InteractionResult {
  const description = customDescription || 
    `No interaction data available for the combination of ${med1}, ${med2}, and ${med3}.`;
    
  return {
    medications: [med1, med2, med3],
    severity: "unknown",
    description,
    sources: [{
      name: "No Data Available",
      severity: "unknown",
      description: "Insufficient data to evaluate this triple combination."
    }],
    confidenceScore: 0,
    aiValidated: false
  };
}

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
  try {
    console.log(`Processing medication triple: ${med1}, ${med2}, ${med3}`);
    
    // Check all pairs within the triple
    const pair1Result = await processMedicationPair(med1, med2, medicationStatuses);
    const pair2Result = await processMedicationPair(med1, med3, medicationStatuses);
    const pair3Result = await processMedicationPair(med2, med3, medicationStatuses);
    
    // Filter out any invalid pair results
    const pairResults = [pair1Result, pair2Result, pair3Result].filter(result => 
      result && result.severity !== undefined && result.sources && result.sources.length > 0
    );
    
    // If no valid pair results, return fallback
    if (pairResults.length === 0) {
      console.warn(`No valid pair results found for triple ${med1}, ${med2}, ${med3}`);
      return createFallbackTripleResult(med1, med2, med3);
    }
    
    console.log(`Found ${pairResults.length} valid pair results for triple ${med1}, ${med2}, ${med3}`);
    
    // Aggregate all sources
    const allSources = pairResults.flatMap(result => result.sources);
    
    // Determine the most severe interaction among the pairs
    const severityOrder = {
      "severe": 0,
      "moderate": 1,
      "minor": 2,
      "unknown": 3,
      "safe": 4
    };
    
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
    
    const finalConfidence = confCount > 0 ? Math.round(combinedConfidence / confCount) : 0;
    
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
      sources: allSources.length > 0 ? allSources : [{
        name: "Based on Pair Analysis",
        severity: mostSevereResult.severity,
        description: "Analysis based on pairwise medication interactions."
      }],
      confidenceScore: finalConfidence,
      aiValidated: pairResults.some(result => result.aiValidated)
    };
  } catch (error) {
    console.error(`Error processing medication triple ${med1}, ${med2}, ${med3}:`, error);
    return createFallbackTripleResult(med1, med2, med3, 
      `An error occurred while processing this medication triple: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
