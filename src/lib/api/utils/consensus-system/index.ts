
/**
 * Weighted Multi-Source Consensus System
 * 
 * This module implements a consensus-based approach to determining interaction severity
 * by weighing multiple data sources according to their reliability.
 * 
 * Enhanced with comprehensive validation and debugging facilities.
 */

// Import validation utilities
import { validateInteractionDetection } from '../tests/interaction-validator';
import { logParsingIssue } from '../diagnostics/api-response-logger';

// Run validation test in development environment to ensure system is working
try {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Consensus System] Running validation tests on startup');
    setTimeout(() => {
      validateInteractionDetection();
    }, 1000); // Delay to avoid blocking startup
  }
} catch (e) {
  console.log('[Consensus System] Validation test not run:', e);
}

// Export the main calculator function
export { calculateConsensusScore } from './consensus-calculator';

// Re-export the utility functions for potential direct use
export { determineSourceWeight } from './source-weight';
export { hasValidInteractionEvidence, applySourceValidationFallback } from './source-validation';
export { determineConsensusDescription } from './description-generator';
export { SEVERE_EVENT_THRESHOLD } from './adverse-event-processor';
export { processSourcesWithWeights } from './source-processor';
export { calculateConfidenceScore } from './confidence-calculator';
export { determineFinalSeverity } from './severity-determiner';
