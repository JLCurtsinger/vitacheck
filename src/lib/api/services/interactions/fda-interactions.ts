import { InteractionSource } from '../../types';

export function checkFDAInteractions(
  med1Warnings: string[],
  med2Warnings: string[]
): {
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
} | null {
  // Only consider warnings that mention both medications
  const relevantWarnings = med1Warnings.filter(warning => 
    med2Warnings.some(w2 => 
      warning.toLowerCase().includes(w2.toLowerCase()) || 
      w2.toLowerCase().includes(warning.toLowerCase())
    )
  );
  
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

    const severity = hasSevereWarning ? "severe" : hasModerateWarning ? "moderate" : "minor";
    const confidence = hasSevereWarning ? 85 : hasModerateWarning ? 80 : 75;
    
    const source: InteractionSource = {
      name: "FDA",
      severity: severity,
      description: relevantWarnings[0],
      confidence: confidence
    };

    return {
      sources: [source],
      description: relevantWarnings[0],
      severity: severity
    };
  }

  // If no direct interaction warnings, check for individual severe warnings
  const individualSevereWarnings = [...med1Warnings, ...med2Warnings].filter(warning =>
    ['fatal', 'death', 'life-threatening', 'contraindicated'].some(keyword => 
      warning.toLowerCase().includes(keyword)
    )
  );

  if (individualSevereWarnings.length > 0) {
    // Return moderate severity with a note about individual warnings
    const source: InteractionSource = {
      name: "FDA",
      severity: "moderate",
      description: "Individual severe warnings exist for these medications. While no direct interaction is documented, caution is advised.",
      confidence: 70
    };

    return {
      sources: [source],
      description: "Individual severe warnings exist for these medications. While no direct interaction is documented, caution is advised.",
      severity: "moderate"
    };
  }

  return null;
}
