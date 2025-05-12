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
 * 
 * New Confidence Logic Rules:
 * - Use weighted agreement: if multiple sources agree, confidence should be higher.
 * - Add extra weight to trusted sources like OpenFDA Adverse Events.
 * - Favor sources with large sample sizes.
 * - Apply a bonus if 3+ total sources are present.
 * - Apply a bonus if AI Literature confirms with reliability and direct evidence.
 * - Cap confidence at 100%.
 * - Never show a confidence score below 50% if there is strong source agreement and a trustworthy source.
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

    // Check for source agreement and trustworthy sources
    const hasTrustedSource = sourceWeights.some(
      ({ source }) => source.name === "OpenFDA Adverse Events" || source.name === "FDA" || source.name === "RxNorm"
    );
    
    const hasLargeSampleSize = sourceWeights.some(
      ({ source }) => source.eventData?.totalEvents && source.eventData.totalEvents > 100
    );

    // Calculate agreement level
    const totalSources = sourceWeights.length;
    const agreeingSources = severityCounts[finalSeverity] || 0;
    const agreementRatio = totalSources > 0 ? agreeingSources / totalSources : 0;

    // Apply weighted agreement bonus
    if (agreementRatio >= 0.75) {
      confidenceScore += 15;
      console.log(`[Confidence Calculator] Added 15% for strong source agreement (${agreementRatio * 100}%): ${confidenceScore}%`);
    } else if (agreementRatio >= 0.5) {
      confidenceScore += 10;
      console.log(`[Confidence Calculator] Added 10% for moderate source agreement (${agreementRatio * 100}%): ${confidenceScore}%`);
    }

    // Apply source count bonus
    if (totalSources >= 3) {
      confidenceScore += 10;
      console.log(`[Confidence Calculator] Added 10% for having 3+ sources: ${confidenceScore}%`);
    }

    // Apply trusted source bonus
    if (hasTrustedSource) {
      confidenceScore += 10;
      console.log(`[Confidence Calculator] Added 10% for trusted source presence: ${confidenceScore}%`);
    }

    // Apply large sample size bonus
    if (hasLargeSampleSize) {
      confidenceScore += 5;
      console.log(`[Confidence Calculator] Added 5% for large sample size: ${confidenceScore}%`);
    }

    // Apply AI validation bonus with direct evidence
    if (aiValidated && severityCounts[finalSeverity] > 1) {
      const hasDirectEvidence = sourceWeights.some(
        ({ source }) => source.hasDirectEvidence === true
      );
      
      if (hasDirectEvidence) {
        confidenceScore += 15;
        console.log(`[Confidence Calculator] Added 15% for AI validation with direct evidence: ${confidenceScore}%`);
      } else {
        confidenceScore += 5;
        console.log(`[Confidence Calculator] Added 5% for AI validation: ${confidenceScore}%`);
      }
    }

    // 'unknown' severity is penalized
    if (finalSeverity === "unknown") {
      confidenceScore -= 30;
      console.log(`[Confidence Calculator] Reduced confidence for unknown severity: ${confidenceScore}%`);
    }

    // Apply minimum confidence threshold for strong agreement cases
    if (confidenceScore < 50 && agreementRatio >= 0.75 && hasTrustedSource) {
      confidenceScore = 50;
      console.log(`[Confidence Calculator] Applied minimum confidence threshold (50%) for strong agreement with trusted source: ${confidenceScore}%`);
    }

    // Fallback mechanism for very low confidence
    if (confidenceScore < 20 && sourceWeights.length > 0) {
      confidenceScore = 20;
      console.log(`[Confidence Calculator] Applied minimum confidence threshold: ${confidenceScore}%`);
    }

    // Ensure final confidence score is between 0 and 100
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

