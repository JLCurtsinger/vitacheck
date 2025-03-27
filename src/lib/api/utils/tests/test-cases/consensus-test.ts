
/**
 * Consensus Calculation Tests
 * 
 * Test functions for consensus system calculation
 */

import { InteractionSource } from '../../../types';
import { calculateConsensusScore } from '../../consensus-system';

/**
 * Test function for consensus calculation
 */
export function testConsensusCalculation(
  sources: InteractionSource[],
  testName: string
): {testName: string, success: boolean, details: any} {
  try {
    console.log(`[Validation Test] Running test: ${testName}`);
    
    // Call the consensus calculation function with both required arguments
    const consensus = calculateConsensusScore(sources, null);
    
    // Validate that we got a result with expected fields
    const hasValidResult = consensus && 
                          typeof consensus.severity === 'string' &&
                          typeof consensus.description === 'string' &&
                          typeof consensus.confidenceScore === 'number';
    
    console.log(`[Validation Test] ${testName} result:`, {
      severity: consensus.severity,
      confidenceScore: consensus.confidenceScore,
      success: hasValidResult
    });
    
    return {
      testName,
      success: hasValidResult,
      details: {
        severity: consensus.severity,
        confidenceScore: consensus.confidenceScore,
        descriptionLength: consensus.description.length
      }
    };
  } catch (error) {
    console.error(`[Validation Test] Test "${testName}" failed:`, error);
    return {
      testName,
      success: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}
