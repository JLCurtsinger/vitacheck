
/**
 * Interaction Validator
 * 
 * Utility functions for validating interaction detection logic
 * and running tests with sample data.
 */

import { InteractionSource } from '../../types';
import { hasValidInteractionEvidence } from '../consensus-system/source-validation';
import { determineFinalSeverity } from '../consensus-system/severity-determiner';
import { calculateConsensusScore } from '../consensus-system';
import { logParsingIssue } from '../diagnostics/api-response-logger';
import { writeToDebugLog } from '../diagnostics/debug-file-logger';

// Sample interaction sources for testing
const testSources: InteractionSource[] = [
  {
    name: "RxNorm",
    severity: "moderate",
    description: "Test interaction description for medication A and medication B. May cause increased risk of side effects.",
    confidence: 85
  },
  {
    name: "FDA",
    severity: "severe",
    description: "Warning: Concomitant use of these medications may lead to serious adverse events.",
    confidence: 95
  },
  {
    name: "SUPP.AI",
    severity: "minor",
    description: "Limited evidence suggests a possible interaction between these medications.",
    confidence: 60
  }
];

// Sample minimal sources with just enough data to be valid
const minimalSources: InteractionSource[] = [
  {
    name: "RxNorm",
    severity: "moderate",
    description: "Brief interaction description", // Just above minimum length
    confidence: 75
  }
];

// Sample sources with no valid interaction data
const invalidSources: InteractionSource[] = [
  {
    name: "Unknown",
    severity: "unknown",
    description: "No data", // Too short
    confidence: 30 // Too low
  }
];

/**
 * Utility to check if all essential elements of interaction detection are working
 * Runs various test cases and logs results
 */
export function validateInteractionDetection(): void {
  console.log('[Validation Test] Starting interaction detection validation');
  const results = [];
  
  try {
    // Test 1: Standard sources with good data
    const testResult = testConsensusCalculation(testSources, "Regular test sources");
    results.push(testResult);
    
    // Test 2: Minimal sources with just enough data to be valid
    const minimalResult = testConsensusCalculation(minimalSources, "Minimal valid sources");
    results.push(minimalResult);
    
    // Test 3: Invalid sources that should fail validation
    const invalidResult = testConsensusCalculation(invalidSources, "Invalid sources");
    results.push(invalidResult);
    
    // Test 4: Mixed valid and invalid sources
    const mixedSources = [...minimalSources, ...invalidSources];
    const mixedResult = testConsensusCalculation(mixedSources, "Mixed valid/invalid sources");
    results.push(mixedResult);
    
    // Test 5: Test source validation directly
    const validationResults = testSourceValidation();
    results.push(...validationResults);
    
    // Log all results
    console.log('[Validation Test] All validation tests completed:', 
      results.filter(r => r.success).length + '/' + results.length + ' tests passed');
    
    // Save detailed results to debug log
    writeToDebugLog('validation_tests', `interaction_validation_${Date.now()}`, {
      timestamp: new Date().toISOString(),
      results,
      allTestsPassed: results.every(r => r.success)
    });
    
    // Don't return anything, as the function is declared to return void
  } catch (error) {
    console.error('[Validation Test] Error running validation tests:', error);
    logParsingIssue('Validation Test', { sources: testSources }, error instanceof Error ? error : String(error));
    // Don't return anything, as the function is declared to return void
  }
}

/**
 * Test function for consensus calculation
 */
function testConsensusCalculation(
  sources: InteractionSource[],
  testName: string
): {testName: string, success: boolean, details: any} {
  try {
    console.log(`[Validation Test] Running test: ${testName}`);
    
    // Call the consensus calculation function
    const consensus = calculateConsensusScore(sources);
    
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

/**
 * Test source validation functions
 */
function testSourceValidation(): Array<{testName: string, success: boolean, details: any}> {
  const results = [];
  
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
    // Fixed: Correctly passing both required arguments to the determineFinalSeverity function
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
