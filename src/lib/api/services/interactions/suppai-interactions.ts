import { getSupplementInteractions } from '../../suppai';
import { InteractionSource } from '../../types';

export async function checkSuppAiInteractions(
  med1: string,
  med2: string
): Promise<{
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "severe" | "unknown";
} | null> {
  const suppAiResults = await getSupplementInteractions(med1);
  const suppAiInteraction = suppAiResults.find(
    int => int.drug1.toLowerCase() === med2.toLowerCase() || 
           int.drug2.toLowerCase() === med2.toLowerCase()
  );

  if (suppAiInteraction) {
    const severity = suppAiInteraction.evidence_count > 5 ? "severe" : "minor";
    return {
      sources: [{
        name: "SUPP.AI",
        severity,
        description: suppAiInteraction.label
      }],
      description: suppAiInteraction.label,
      severity
    };
  }

  return null;
}