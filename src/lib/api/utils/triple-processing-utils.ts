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
    result.sources.forEach(source => {
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
    
    // Determine the most severe interaction among the pairs
    const severityOrder = {
      "severe": 0,
      "moderate": 1,
      "minor": 2,
      "unknown": 3,
      "safe": 4
    };
    
    // Sort by severity (most severe first)
    pairResults.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    const mostSevereResult = pairResults[0];
    
    // Calculate average confidence score from all valid pairs
    const validConfidenceScores = pairResults
      .map(result => result.confidenceScore)
      .filter((score): score is number => score !== undefined);
    
    const averageConfidence = validConfidenceScores.length > 0
      ? validConfidenceScores.reduce((sum, score) => sum + score, 0) / validConfidenceScores.length
      : 0;
    
    // Aggregate all sources, removing duplicates and keeping the most relevant ones
    const aggregatedSources = aggregateSources(pairResults);
    
    // Generate a comprehensive description
    const description = generateTripleDescription(med1, med2, med3, pairResults, mostSevereResult);
    
    return {
      medications: [med1, med2, med3],
      severity: mostSevereResult.severity,
      description,
      sources: aggregatedSources.length > 0 ? aggregatedSources : [{
        name: "Based on Pair Analysis",
        severity: mostSevereResult.severity,
        description: "Analysis based on pairwise medication interactions.",
        confidence: averageConfidence,
        processed: true,
        hasInsight: true
      }],
      confidenceScore: averageConfidence,
      aiValidated: pairResults.some(result => result.aiValidated)
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
  mostSevereResult: InteractionResult
): string {
  let description = `Analysis of triple combination: ${med1}, ${med2}, and ${med3}. `;
  
  // Add severity-specific information
  if (mostSevereResult.severity === "severe") {
    description += `WARNING: This combination includes a severe interaction that may be dangerous. `;
  } else if (mostSevereResult.severity === "moderate") {
    description += `Caution: This combination includes a moderate interaction that requires careful monitoring. `;
  } else if (mostSevereResult.severity === "minor") {
    description += `This combination includes a minor interaction that may require monitoring. `;
  } else if (mostSevereResult.severity === "safe") {
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
