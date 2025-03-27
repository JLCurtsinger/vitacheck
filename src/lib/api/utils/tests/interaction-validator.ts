
/**
 * Interaction Validator
 * 
 * Utility functions for validating interaction detection logic
 * and running tests with sample data.
 */

import { writeToDebugLog } from '../diagnostics/debug-file-logger';
import { logParsingIssue } from '../diagnostics/api-response-logger';
import { testConsensusCalculation } from './test-cases/consensus-test';
import { testSourceValidation } from './test-cases/source-validation-test';
import { testSources, minimalSources, invalidSources } from './data/test-sources';

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
