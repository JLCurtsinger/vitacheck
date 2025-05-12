/**
 * Triple Processing Utilities
 * 
 * Handles processing triple medication combinations to analyze for interactions
 */

import { InteractionResult, MedicationLookupResult, InteractionSource } from '../types';
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
 * Aggregates sources from multiple interaction results, removing duplicates
 * and maintaining the most relevant information
 */
function aggregateSources(results: InteractionResult[]): InteractionSource[] {
  const sourceMap = new Map<string, InteractionSource>();
  
  // Process all sources from all results
  results.forEach(result => {
    // Skip results with missing or invalid sources
    if (!result?.sources || !Array.isArray(result.sources)) {
      console.warn(`Skipping result with invalid sources array for medications: ${result?.medications?.join(' + ') || 'unknown'}`);
      return;
    }

    result.sources.forEach(source => {
      // Skip invalid sources
      if (!source?.name || !source?.severity) {
        console.warn(`Skipping invalid source in result for medications: ${result.medications.join(' + ')}`);
        return;
      }

      const key = `${source.name}-${source.severity}`;
      
      // If we haven't seen this source before, or if this one has higher confidence
      if (!sourceMap.has(key) || 
          (source.confidence && sourceMap.get(key)?.confidence && 
           source.confidence > (sourceMap.get(key)?.confidence || 0))) {
        sourceMap.set(key, source);
      }
    });
  });
  
  return Array.from(sourceMap.values());
}

/**
 * Determines the overall severity for a triple based on pair results
 * Prioritizes "severe" interactions and falls back to most severe remaining result
 */
function determineTripleSeverity(pairResults: InteractionResult[]): "unknown" | "safe" | "minor" | "moderate" | "severe" {
  // First check if any pair has severe interaction
  const hasSevere = pairResults.some(result => result.severity === "severe");
  if (hasSevere) {
    return "severe";
  }

  // If no severe interactions, find the most severe remaining result
  const severityOrder: Record<"moderate" | "minor" | "unknown" | "safe", number> = {
    "moderate": 0,
    "minor": 1,
    "unknown": 2,
    "safe": 3
  };

  return pairResults.reduce((mostSevere, current) => {
    return severityOrder[current.severity as keyof typeof severityOrder] < severityOrder[mostSevere as keyof typeof severityOrder]
      ? current.severity
      : mostSevere;
  }, pairResults[0].severity);
}

/**
 * Formats a confidence score for display purposes
 * Uses 1 decimal place for scores with decimals, rounds whole numbers
 */
function formatConfidenceScore(score: number): string {
  return score % 1 === 0 
    ? Math.round(score).toString() 
    : score.toFixed(1);
}

/**
 * Process a triple of medications to determine potential interactions
 * 
 * This analysis is based on analyzing all pairs within the triple and combining their results.
 * Uses the new API-first approach for each pair and aggregates the results.
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
    
    // Process all pairs using the updated API-first approach
    const [pair1Result, pair2Result, pair3Result] = await Promise.all([
      processMedicationPair(med1, med2, medicationStatuses),
      processMedicationPair(med1, med3, medicationStatuses),
      processMedicationPair(med2, med3, medicationStatuses)
    ]);
    
    // Filter out any invalid pair results with proper null checks
    const pairResults = [pair1Result, pair2Result, pair3Result].filter(result => {
      if (!result) {
        console.warn('Skipping null pair result');
        return false;
      }
      if (!result.sources || !Array.isArray(result.sources)) {
        console.warn(`Skipping pair result with invalid sources for medications: ${result.medications?.join(' + ') || 'unknown'}`);
        return false;
      }
      if (result.severity === undefined) {
        console.warn(`Skipping pair result with undefined severity for medications: ${result.medications?.join(' + ') || 'unknown'}`);
        return false;
      }
      return true;
    });
    
    // If no valid pair results, return fallback
    if (pairResults.length === 0) {
      console.warn(`No valid pair results found for triple ${med1}, ${med2}, ${med3}`);
      return createFallbackTripleResult(med1, med2, med3);
    }
    
    console.log(`Found ${pairResults.length} valid pair results for triple ${med1}, ${med2}, ${med3}`);
    
    // Calculate average confidence score from all valid pairs
    const validConfidenceScores = pairResults
      .map(result => result.confidenceScore)
      .filter((score): score is number => score !== undefined && !isNaN(score));
    
    const averageConfidence = validConfidenceScores.length > 0
      ? validConfidenceScores.reduce((sum, score) => sum + score, 0) / validConfidenceScores.length
      : 0;
    
    // Determine overall severity using new logic
    const overallSeverity = determineTripleSeverity(pairResults);
    
    // Aggregate all sources, removing duplicates and keeping the most relevant ones
    const aggregatedSources = aggregateSources(pairResults);
    
    // Generate a comprehensive description
    const description = generateTripleDescription(med1, med2, med3, pairResults, overallSeverity);
    
    // Ensure we always have at least one source
    const finalSources = aggregatedSources.length > 0 ? aggregatedSources : [{
      name: "Based on Pair Analysis",
      severity: overallSeverity as "unknown" | "safe" | "minor" | "moderate" | "severe",
      description: "Analysis based on pairwise medication interactions.",
      confidence: averageConfidence,
      processed: true,
      hasInsight: true
    }];
    
    return {
      medications: [med1, med2, med3],
      severity: overallSeverity,
      description,
      sources: finalSources,
      confidenceScore: averageConfidence,
      aiValidated: pairResults.some(result => result?.aiValidated === true)
    };
  } catch (error) {
    console.error(`Error processing medication triple ${med1}, ${med2}, ${med3}:`, error);
    return createFallbackTripleResult(med1, med2, med3, 
      `An error occurred while processing this medication triple: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates a comprehensive description for the triple interaction result
 */
function generateTripleDescription(
  med1: string,
  med2: string,
  med3: string,
  pairResults: InteractionResult[],
  overallSeverity: string
): string {
  let description = `Analysis of triple combination: ${med1}, ${med2}, and ${med3}. `;
  
  // Add severity-specific information
  if (overallSeverity === "severe") {
    description += `WARNING: This combination includes a severe interaction that may be dangerous. `;
  } else if (overallSeverity === "moderate") {
    description += `Caution: This combination includes a moderate interaction that requires careful monitoring. `;
  } else if (overallSeverity === "minor") {
    description += `This combination includes a minor interaction that may require monitoring. `;
  } else if (overallSeverity === "safe") {
    description += `No significant interactions detected between these medications. `;
  } else {
    description += `Insufficient data to fully evaluate this triple combination. `;
  }
  
  // Add information about the number of valid pairs
  if (pairResults.length < 3) {
    description += `Note: Only ${pairResults.length} out of 3 possible pairs could be evaluated. `;
  }
  
  // Add AI validation status if applicable
  if (pairResults.some(result => result.aiValidated)) {
    description += `This analysis has been validated by AI.`;
  }
  
  return description;
}
