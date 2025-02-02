import { InteractionSource } from '../../types';

export function checkFDAInteractions(
  med1Warnings: string[],
  med2Warnings: string[]
): {
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "severe" | "unknown";
} | null {
  const relevantWarnings = [...med1Warnings, ...med2Warnings];
  
  if (relevantWarnings.length > 0) {
    return {
      sources: [{
        name: "FDA",
        severity: "severe",
        description: relevantWarnings[0]
      }],
      description: relevantWarnings[0],
      severity: "severe"
    };
  }

  return null;
}