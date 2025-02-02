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
    // Look for severe warning keywords
    const severeKeywords = ['severe', 'danger', 'fatal', 'death', 'avoid', 'do not'];
    const hasSevereWarning = relevantWarnings.some(warning => 
      severeKeywords.some(keyword => warning.toLowerCase().includes(keyword))
    );

    return {
      sources: [{
        name: "FDA",
        severity: hasSevereWarning ? "severe" : "minor",
        description: relevantWarnings[0]
      }],
      description: relevantWarnings[0],
      severity: hasSevereWarning ? "severe" : "minor"
    };
  }

  return null;
}