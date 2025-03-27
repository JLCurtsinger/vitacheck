
/**
 * Weighted Multi-Source Consensus System
 * 
 * This module implements a consensus-based approach to determining interaction severity
 * by weighing multiple data sources according to their reliability.
 */

// Export the main calculator function
export { calculateConsensusScore } from './consensus-calculator';

// Re-export the utility functions for potential direct use
export { determineSourceWeight } from './source-weight';
export { hasValidInteractionEvidence } from './source-validation';
export { determineConsensusDescription } from './description-generator';
export { SEVERE_EVENT_THRESHOLD } from './adverse-event-processor';
export { processSourcesWithWeights } from './source-processor';
export { calculateConfidenceScore } from './confidence-calculator';
export { determineFinalSeverity } from './severity-determiner';
