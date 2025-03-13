
/**
 * Utility for formatting interaction responses
 */
import { InteractionSource } from '../../../types';

/**
 * Creates a standardized response object for interaction data
 */
export function formatInteractionResponse(
  sourceName: string,
  severity: "safe" | "minor" | "severe" | "unknown",
  description: string
): {
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "severe" | "unknown";
} {
  return {
    sources: [{
      name: sourceName,
      severity,
      description
    }],
    description,
    severity
  };
}
