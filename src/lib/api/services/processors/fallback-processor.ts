
import { CombinationResult } from '../combination-types';

/**
 * Creates a fallback combination result when data is unavailable or processing fails
 */
export function createFallbackCombinationResult(
  medications: string[],
  type: 'single' | 'pair' | 'triple',
  error?: string
): CombinationResult {
  const label = medications.join(' + ');
  const description = error || `No data available for this ${type} combination.`;
  
  return {
    medications,
    severity: "unknown",
    description,
    sources: [{
      name: "No data available",
      severity: "unknown",
      description
    }],
    type,
    label
  };
}
