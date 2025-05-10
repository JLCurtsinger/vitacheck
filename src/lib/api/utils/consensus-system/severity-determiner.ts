/**
 * Severity Determiner
 * 
 * This module determines the final severity based on weighted votes.
 * Enhanced with detailed logging and fallback mechanisms.
 */

import { logParsingIssue } from '../diagnostics/api-response-logger';

/**
 * Determines the final severity based on weighted votes and special conditions
 * Now with enhanced logging and fallback mechanisms
 */
export function determineFinalSeverity(
  severityVotes: Record<string, number>,
  sourceWeights: { source: any, weight: number }[]
): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  try {
    const isDebug = process.env.DEBUG === 'true';
    if (isDebug) {
      console.log('[Severity Determiner] Processing severity votes:', severityVotes);
    }
    
    // Count high-confidence sources (weight >= 0.6) reporting severe
    const highConfidenceSevereSources = sourceWeights.filter(({ source, weight }) => 
      source.severity === "severe" && weight >= 0.6 && source.name !== "AI Literature Analysis"
    );
    
    // Count moderate reports from different sources (excluding AI)
    const moderateSourceCount = sourceWeights.filter(({ source }) => 
      source.severity === "moderate" && source.name !== "AI Literature Analysis"
    ).length;
    
    // RULE 1: Only assign "severe" if at least one high-confidence source reports severe
    // OR if multiple (2+) sources report moderate
    if (severityVotes.severe > 0 && 
        (highConfidenceSevereSources.length > 0 || moderateSourceCount >= 2)) {
      if (isDebug) {
        console.log('[Severity Determiner] Found severe rating from high-confidence source or multiple moderate sources');
      }
      return "severe";
    }
    
    // Debug information about vote distribution
    if (isDebug) {
      console.log('[Severity Determiner] Vote distribution:', {
        severe: severityVotes.severe || 0,
        moderate: severityVotes.moderate || 0,
        minor: severityVotes.minor || 0,
        safe: severityVotes.safe || 0,
        unknown: severityVotes.unknown || 0
      });
    }
    
    // Otherwise determine by highest weighted vote
    // Process severity keys in a fixed order for deterministic results
    const severityKeys: ("severe" | "moderate" | "minor" | "safe" | "unknown")[] = ["severe", "moderate", "minor", "safe", "unknown"];
    
    let finalSeverity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
    let maxVote = 0;
    
    for (const severity of severityKeys) {
      const currentVote = severityVotes[severity] || 0;
      if (currentVote > maxVote) {
        maxVote = currentVote;
        finalSeverity = severity;
        if (isDebug) {
          console.log(`[Severity Determiner] New highest vote: ${severity} with ${currentVote}`);
        }
      }
    }
    
    // RULE 2: Never allow AI to directly dictate severe rating
    // If AI is the only source suggesting severe, cap at moderate
    if (finalSeverity === "severe" && highConfidenceSevereSources.length === 0) {
      // Check if any non-AI source contributed to the severe rating
      const hasNonAiSevereSources = sourceWeights.some(({ source }) => 
        source.severity === "severe" && source.name !== "AI Literature Analysis"
      );
      
      // If no non-AI severe sources, cap at moderate
      if (!hasNonAiSevereSources) {
        finalSeverity = "moderate";
        if (isDebug) {
          console.log('[Severity Determiner] Capping severity at moderate due to lack of high-confidence sources');
        }
      }
    }
    
    // Fallback mechanism: If all votes are zero or very low, but we have sources
    if (maxVote < 0.1 && sourceWeights.length > 0) {
      if (isDebug) {
        console.log('[Severity Determiner] Very low votes detected, applying fallback logic');
      }
      
      // Try to find any explicit severity in sources
      for (const { source } of sourceWeights) {
        if (source.severity && source.severity !== "unknown" && source.name !== "AI Literature Analysis") {
          finalSeverity = source.severity;
          if (isDebug) {
            console.log(`[Severity Determiner] Fallback: Using explicit severity "${finalSeverity}" from source`);
          }
          break;
        }
      }
      
      // If still unknown, use conservative approach for safety
      if (finalSeverity === "unknown" && sourceWeights.length > 1) {
        finalSeverity = "moderate"; // Conservative assumption when multiple sources but unclear severity
        if (isDebug) {
          console.log('[Severity Determiner] Fallback: Using conservative "moderate" rating due to multiple sources');
        }
      }
    }
    
    if (isDebug) {
      console.log(`[Severity Determiner] Final severity determined: ${finalSeverity}`);
    }
    return finalSeverity;
  } catch (error) {
    // Log the error and provide a fallback severity
    logParsingIssue(
      'Severity Determiner', 
      { severityVotes, sourceWeights }, 
      error instanceof Error ? error : String(error)
    );
    
    // Conservative fallback in case of errors
    console.error('[Severity Determiner] Error determining severity, using fallback "moderate"');
    return "moderate";
  }
}
