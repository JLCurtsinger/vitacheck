
/**
 * Source Validation Tests
 * 
 * Tests for validation of interaction sources
 */

import { InteractionSource } from '../../../types';
import { hasValidInteractionEvidence } from '../../consensus-system/source-validation';
import { determineFinalSeverity } from '../../consensus-system/severity-determiner';

/**
 * Test source validation functions
 */
export function testSourceValidation(): Array<{testName: string, success: boolean, details: any}> {
  const results = [];
  
  // Import test data dynamically to avoid circular dependencies
  const { testSources, invalidSources } = require('../data/test-sources');
  
  // Test valid source
  const validTest = {
    testName: "Valid source validation",
    success: hasValidInteractionEvidence(testSources[0]),
    details: { source: testSources[0] }
  };
  results.push(validTest);
  
  // Test invalid source
  const invalidTest = {
    testName: "Invalid source validation",
    success: !hasValidInteractionEvidence(invalidSources[0]),
    details: { source: invalidSources[0] }
  };
  results.push(invalidTest);
  
  // Test severity determination directly
  const sourceWeights = testSources.map(source => ({ 
    source,
    weight: source.confidence / 100 
  }));
  
  const severityVotes = {
    severe: 95,
    moderate: 85,
    minor: 60,
    safe: 0,
    unknown: 0
  };
  
  try {
    // Both required arguments are now passed to determineFinalSeverity
    const severity = determineFinalSeverity(severityVotes, sourceWeights);
    
    results.push({
      testName: "Severity determination",
      success: severity === "severe", // Should choose severe as highest weighted
      details: { result: severity, expected: "severe" }
    });
  } catch (error) {
    results.push({
      testName: "Severity determination",
      success: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    });
  }
  
  return results;
}
