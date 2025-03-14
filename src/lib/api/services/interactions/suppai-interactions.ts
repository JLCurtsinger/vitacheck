
import { getSupplementInteractions } from '../../suppai';
import { InteractionSource } from '../../types';

export async function checkSuppAiInteractions(
  med1: string,
  med2: string
): Promise<{
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
} | null> {
  const suppAiResults = await getSupplementInteractions(med1);
  const suppAiInteraction = suppAiResults.find(
    int => int.drug1.toLowerCase() === med2.toLowerCase() || 
           int.drug2.toLowerCase() === med2.toLowerCase()
  );

  if (suppAiInteraction) {
    // Determine severity based on evidence count and label content
    let severity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "minor";
    
    const description = suppAiInteraction.label;
    
    // Check for severe keywords in the description
    const severeKeywords = ['fatal', 'death', 'life-threatening', 'contraindicated', 'do not combine'];
    const moderateKeywords = ['severe', 'serious', 'warning', 'avoid', 'caution'];
    
    if (severeKeywords.some(keyword => description.toLowerCase().includes(keyword))) {
      severity = "severe";
    } else if (moderateKeywords.some(keyword => description.toLowerCase().includes(keyword)) || 
              suppAiInteraction.evidence_count > 8) {
      severity = "moderate";
    } else if (suppAiInteraction.evidence_count > 3) {
      severity = "minor";
    }
    
    // Base confidence on evidence count
    let confidence = 50; // Base confidence for SUPP.AI
    
    if (suppAiInteraction.evidence_count > 10) {
      confidence = 70;
    } else if (suppAiInteraction.evidence_count > 5) {
      confidence = 65;
    } else if (suppAiInteraction.evidence_count > 3) {
      confidence = 60;
    }
    
    const source: InteractionSource = {
      name: "SUPP.AI",
      severity: severity,
      description: description,
      confidence: confidence
    };
    
    return {
      sources: [source],
      description,
      severity
    };
  }

  return null;
}
