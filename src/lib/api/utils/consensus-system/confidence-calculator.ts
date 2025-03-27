
/**
 * Confidence Score Calculator
 * 
 * This module calculates confidence scores for consensus results.
 * Enhanced with detailed logging and fallback mechanisms.
 */

import { InteractionSource } from '../../types';
import { logParsingIssue } from '../diagnostics/api-response-logger';

/**
 * Calculates the confidence score based on vote distribution and source agreement
 * Now with enhanced logging and fallback mechanisms
 */
export function calculateConfidenceScore(
  finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown",
  severityVotes: Record<string, number>,
  totalWeight: number,
  sourceWeights: { source: InteractionSource, weight: number }[],
  severityCounts: Record<string, number>,
  aiValidated: boolean
): number {
  try {
    console.log('[Confidence Calculator] Starting confidence calculation:', {
      finalSeverity,
      totalWeight,
      sourceCount: sourceWeights.length,
      aiValidated
    });
    
    // Calculate base confidence score (0-100%) based on the weighted average
    const primaryVote = severityVotes[finalSeverity] || 0;
    let confidenceScore = totalWeight > 0 ? Math.round((primaryVote / totalWeight) * 100) : 0;
    
    console.log(`[Confidence Calculator] Base confidence from votes: ${confidenceScore}%`);
    
    // Apply additional confidence adjustments with detailed logging
    if (sourceWeights.length >= 3) {
      confidenceScore = Math.min(100, confidenceScore + 5);
      console.log(`[Confidence Calculator] Added 5% for having 3+ sources: ${confidenceScore}%`);
    }
    
    // Adjust confidence based on source agreement
    const allAgree = Object.values(severityCounts).filter(count => count > 0).length === 1;
    if (allAgree && sourceWeights.length > 1) {
      confidenceScore = Math.min(100, confidenceScore + 10);
      console.log(`[Confidence Calculator] Added 10% for source agreement: ${confidenceScore}%`);
    }
    
    // AI validation adjustment
    if (aiValidated && severityCounts[finalSeverity] > 1) {
      confidenceScore = Math.min(100, confidenceScore + 5);
      console.log(`[Confidence Calculator] Added 5% for AI validation: ${confidenceScore}%`);
    }
    
    // Additional adjustment for "unknown" severity - reduce confidence
    if (finalSeverity === "unknown") {
      confidenceScore = Math.max(10, confidenceScore - 30);
      console.log(`[Confidence Calculator] Reduced confidence for unknown severity: ${confidenceScore}%`);
    }
    
    // Additional confidence boosts for high-quality sources
    const hasHighQualitySource = sourceWeights.some(
      ({ source, weight }) => weight > 0.8 && (source.name === "FDA" || source.name === "RxNorm")
    );
    
    if (hasHighQualitySource) {
      confidenceScore = Math.min(100, confidenceScore + 5);
      console.log(`[Confidence Calculator] Added 5% for high-quality source: ${confidenceScore}%`);
    }
    
    // Fallback mechanism for very low confidence
    if (confidenceScore < 20 && sourceWeights.length > 0) {
      // If we have sources but low confidence, set a minimum baseline
      confidenceScore = 20;
      console.log(`[Confidence Calculator] Applied minimum confidence threshold: ${confidenceScore}%`);
    }
    
    console.log(`[Confidence Calculator] Final confidence score: ${confidenceScore}%`);
    return confidenceScore;
  } catch (error) {
    // Log the error and provide a fallback confidence score
    logParsingIssue(
      'Confidence Calculator', 
      { 
        finalSeverity, 
        severityVotes, 
        totalWeight,
        sourceWeights,
        severityCounts,
        aiValidated 
      }, 
      error instanceof Error ? error : String(error)
    );
    
    // When in doubt, provide a moderate confidence level (50%)
    console.error('[Confidence Calculator] Error calculating confidence, using fallback 50%');
    return 50;
  }
}
