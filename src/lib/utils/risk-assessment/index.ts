
/**
 * Risk Assessment Utility
 * 
 * This module provides functions for calculating standardized risk scores
 * based on data from multiple sources.
 */

// Export all types
export * from './types';

// Export calculation functions
export { calculateRiskScore } from './calculator';
export { prepareRiskAssessment } from './processor';

// Export constants for external use if needed
export { SOURCE_WEIGHTS, DEFAULT_SCORES, SEVERITY_MULTIPLIERS } from './constants';

/**
 * Example usage:
 * 
 * const rawData = {
 *   fdaReports: { signal: true, count: 87 },
 *   suppAI: { signal: false },
 *   mechanism: { plausible: true },
 *   peerReports: { signal: false },
 *   severity: 'severe' as const
 * };
 * 
 * const assessment = prepareRiskAssessment(rawData);
 * 
 * // Result would contain:
 * // {
 * //   riskScore: (calculated value 0-100),
 * //   confidence: (calculated value 0-100),
 * //   severityFlag: '🔴', '🟡', or '🟢',
 * //   inputSummary: {
 * //     severity: 'severe',
 * //     sources: {
 * //       fdaReports: { signal: true, score: 83, weight: 0.35 },
 * //       suppAI: { signal: false, score: 50, weight: 0.15 },
 * //       mechanism: { plausible: true, score: 60, weight: 0.3 },
 * //       peerReports: { signal: false, score: 40, weight: 0.05 }
 * //     }
 * //   }
 * // }
 */
