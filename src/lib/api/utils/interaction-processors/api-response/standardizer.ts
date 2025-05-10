
/**
 * API Response Standardizer
 * 
 * This module standardizes various API responses into a consistent format
 * for processing and analysis.
 */

import { StandardizedApiResponse } from '../../../types';

/**
 * Standardizes an API response into a consistent format
 */
export function standardizeApiResponse(
  sourceName: string,
  rawData: any,
  description: string = "No description available"
): StandardizedApiResponse {
  return {
    sources: [{
      name: sourceName,
      severity: "unknown",
      description
    }],
    severity: null, // Will be assigned by scoring or ML
    description,
    confidence: undefined,
    rawData,
    processed: false
  };
}

/**
 * Standardizes the RxNorm API response into a consistent format
 */
export function standardizeRxNormResponse(
  rxnormData: any
): StandardizedApiResponse {
  // Default values
  let description = "No interaction information available from RxNorm.";
  
  try {
    // Check if we have interaction data in expected format
    if (rxnormData?.fullInteractionTypeGroup && rxnormData.fullInteractionTypeGroup.length > 0) {
      // Format a basic description from the first interaction found
      const firstGroup = rxnormData.fullInteractionTypeGroup[0];
      if (firstGroup.fullInteractionType && firstGroup.fullInteractionType.length > 0) {
        const firstInteraction = firstGroup.fullInteractionType[0];
        if (firstInteraction.interactionPair && firstInteraction.interactionPair.length > 0) {
          const pair = firstInteraction.interactionPair[0];
          description = pair.description || description;
        }
      }
    }
  } catch (error) {
    console.error('Error standardizing RxNorm response:', error);
  }
  
  return standardizeApiResponse('RxNorm', rxnormData, description);
}

/**
 * Standardizes the SUPP.AI API response into a consistent format
 */
export function standardizeSuppAiResponse(
  suppaiData: any
): StandardizedApiResponse {
  // Default values
  let description = "No interaction information available from SUPP.AI.";
  
  try {
    // Check if we have interaction data in expected format
    if (suppaiData?.interactions && suppaiData.interactions.length > 0) {
      const firstInteraction = suppaiData.interactions[0];
      
      // Extract evidence text if available
      if (firstInteraction.evidences && firstInteraction.evidences.length > 0) {
        const bestEvidence = firstInteraction.evidences
          .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];
        description = bestEvidence.sentence || bestEvidence.text || description;
      }
    }
  } catch (error) {
    console.error('Error standardizing SUPP.AI response:', error);
  }
  
  return standardizeApiResponse('SUPP.AI', suppaiData, description);
}

/**
 * Standardizes the FDA API response into a consistent format
 */
export function standardizeFDAResponse(
  fdaData: any
): StandardizedApiResponse {
  // Default values
  let description = "No interaction information available from FDA.";
  
  try {
    // Check if we have interaction data in expected format
    if (fdaData?.results && fdaData.results.length > 0) {
      const firstResult = fdaData.results[0];
      
      // Check for warnings or drug interactions
      if (firstResult.warnings && firstResult.warnings.length > 0) {
        description = firstResult.warnings[0];
      } else if (firstResult.drug_interactions && firstResult.drug_interactions.length > 0) {
        description = firstResult.drug_interactions[0];
      }
    }
  } catch (error) {
    console.error('Error standardizing FDA response:', error);
  }
  
  return standardizeApiResponse('FDA', fdaData, description);
}

/**
 * Standardizes the AI Literature Analysis response into a consistent format
 */
export function standardizeAiLiteratureResponse(
  aiData: any
): StandardizedApiResponse {
  // Default values
  let description = "No literature analysis available.";
  let severity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
  
  try {
    // Check if we have data in expected format
    if (aiData?.analysis) {
      description = aiData.analysis.summary || description;
      severity = aiData.analysis.severity || "unknown";
    }
  } catch (error) {
    console.error('Error standardizing AI Literature response:', error);
  }
  
  return {
    sources: [{
      name: "AI Literature Analysis",
      severity,
      description
    }],
    severity: severity,
    description,
    confidence: undefined,
    rawData: aiData,
    processed: false
  };
}
