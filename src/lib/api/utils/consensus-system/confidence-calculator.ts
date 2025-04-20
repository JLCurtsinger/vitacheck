
/**
 * Confidence Score Calculator
 * 
 * This module calculates confidence scores for consensus results.
 * Enhanced with detailed logging, normalization, and fallback mechanisms.
 * 
 * ---
 * Confidence Score Methodology:
 * - The confidence score quantifies reliability of the final consensus interaction severity on a 0–100% scale.
 * - Each API/source (RxNorm, FDA, SUPP.AI, AI Literature, etc.) receives a normalized weight based on reliability and data quality.
 * - We tally votes for the determined 'finalSeverity' with their source weights, then calculate the primaryVote/totalWeight ratio.
 * - Additional boosts are given for high source count, agreement across sources, AI validation, and reputable sources (see below).
 * - Confidence is capped at 100%: final value is always within [0, 100].
 * - The score reflects source reliability, agreement, and validation—not clinical certainty.
 * - No raw sum of confidence: all weightings and boosts are normalized to this 0–100 range.
 * - If AI literature analysis corroborates a majority, extra points are awarded.
 * - If 'unknown', a penalty is applied instead.
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

    // Compute base confidence: primaryVote / totalWeight, then scale to 0–100
    const primaryVote = severityVotes[finalSeverity] || 0;
    // Clamp denominator to avoid NaN/infinity
    let confidenceScore = totalWeight > 0 ? Math.round((primaryVote / totalWeight) * 100) : 0;

    console.log(`[Confidence Calculator] Base confidence from votes: ${confidenceScore}%`, {
      primaryVote,
      totalWeight,
      calculation: totalWeight > 0 ? `${primaryVote} / ${totalWeight} * 100 = ${confidenceScore}` : 'No weight'
    });

    // Adjust upwards for information richness/agreement
    if (sourceWeights.length >= 3) {
      confidenceScore += 5;
      console.log(`[Confidence Calculator] Added 5% for having 3+ sources: ${confidenceScore}%`);
    }

    // Upward adjustment if all sources agree
    const allAgree = Object.values(severityCounts).filter(count => count > 0).length === 1;
    if (allAgree && sourceWeights.length > 1) {
      confidenceScore += 10;
      console.log(`[Confidence Calculator] Added 10% for source agreement: ${confidenceScore}%`);
    }

    // AI validation boost
    if (aiValidated && severityCounts[finalSeverity] > 1) {
      confidenceScore += 5;
      console.log(`[Confidence Calculator] Added 5% for AI validation: ${confidenceScore}%`);
    }

    // 'unknown' severity is penalized
    if (finalSeverity === "unknown") {
      confidenceScore -= 30;
      console.log(`[Confidence Calculator] Reduced confidence for unknown severity: ${confidenceScore}%`);
    }

    // Additional confidence boosts for high-quality sources
    const hasHighQualitySource = sourceWeights.some(
      ({ source, weight }) => weight > 0.8 && (source.name === "FDA" || source.name === "RxNorm")
    );

    if (hasHighQualitySource) {
      confidenceScore += 5;
      console.log(`[Confidence Calculator] Added 5% for high-quality source: ${confidenceScore}%`);
    }

    // Fallback mechanism for very low confidence
    if (confidenceScore < 20 && sourceWeights.length > 0) {
      confidenceScore = 20;
      console.log(`[Confidence Calculator] Applied minimum confidence threshold: ${confidenceScore}%`);
    }

    // --- ENSURE FINAL CONFIDENCE SCORE IS MAX 100 (main fix for this request) ---
    confidenceScore = Math.max(0, Math.min(confidenceScore, 100));

    console.log(`[Confidence Calculator] Final confidence score (capped to 0–100): ${confidenceScore}%`);
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

