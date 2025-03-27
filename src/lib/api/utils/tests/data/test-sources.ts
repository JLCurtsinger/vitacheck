
/**
 * Test Sample Data
 * 
 * Contains sample interaction sources for testing validation logic.
 */

import { InteractionSource } from '../../../types';

// Sample interaction sources for testing
export const testSources: InteractionSource[] = [
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
export const minimalSources: InteractionSource[] = [
  {
    name: "RxNorm",
    severity: "moderate",
    description: "Brief interaction description", // Just above minimum length
    confidence: 75
  }
];

// Sample sources with no valid interaction data
export const invalidSources: InteractionSource[] = [
  {
    name: "Unknown",
    severity: "unknown",
    description: "No data", // Too short
    confidence: 30 // Too low
  }
];
