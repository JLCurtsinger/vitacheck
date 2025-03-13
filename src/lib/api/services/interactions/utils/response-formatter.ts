
import { InteractionSource } from "../../../types";

/**
 * Formats an interaction response into a standardized format
 */
export function formatInteractionResponse(
  sourceName: string,
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown",
  description: string
): {
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
} {
  return {
    sources: [{
      name: sourceName,
      severity: severity,
      description: description
    }],
    description: description,
    severity: severity
  };
}
