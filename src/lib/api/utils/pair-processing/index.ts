
/**
 * Medication Pair Processing Module
 * 
 * This module exports all functionality related to processing medication pairs
 * and determining interaction severity based on multiple data sources.
 */

// Export primary functions
export { processMedicationPair } from './process-pair';
export { createFallbackInteractionResult } from './fallback-result';
export { generateMedicationPairs } from './generate-pairs';

// Re-export from supporting modules
export * from './cache-utils';
export * from './check-high-risk';

