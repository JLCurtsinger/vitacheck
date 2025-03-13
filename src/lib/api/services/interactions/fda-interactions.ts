
import { InteractionSource } from '../../types';

export function checkFDAInteractions(
  med1Warnings: string[],
  med2Warnings: string[]
): {
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
} | null {
  const relevantWarnings = [...med1Warnings, ...med2Warnings];
  
  if (relevantWarnings.length > 0) {
    // Look for severe warning keywords
    const severeKeywords = ['fatal', 'death', 'life-threatening', 'contraindicated'];
    const moderateKeywords = ['severe', 'serious', 'avoid', 'do not', 'warning'];
    
    const hasSevereWarning = relevantWarnings.some(warning => 
      severeKeywords.some(keyword => warning.toLowerCase().includes(keyword))
    );
    
    const hasModerateWarning = !hasSevereWarning && relevantWarnings.some(warning => 
      moderateKeywords.some(keyword => warning.toLowerCase().includes(keyword))
    );

    return {
      sources: [{
        name: "FDA",
        severity: hasSevereWarning ? "severe" : hasModerateWarning ? "moderate" : "minor",
        description: relevantWarnings[0]
      }],
      description: relevantWarnings[0],
      severity: hasSevereWarning ? "severe" : hasModerateWarning ? "moderate" : "minor"
    };
  }

  return null;
}
