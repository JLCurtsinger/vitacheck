
import { getSupplementInteractions } from '../../suppai';
import { InteractionSource } from '../../types';
import { prepareMedicationNameForApi } from '@/utils/medication-formatter';

export async function checkSuppAiInteractions(
  med1: string,
  med2: string
): Promise<{
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
} | null> {
  // Format medication names for API
  const formattedMed1 = prepareMedicationNameForApi(med1);
  const formattedMed2 = prepareMedicationNameForApi(med2);
  
  console.log(`[SUPP.AI] Checking interactions between "${formattedMed1}" and "${formattedMed2}"`);
  console.log(`[SUPP.AI] Original names: "${med1}" and "${med2}"`);
  
  const suppAiResults = await getSupplementInteractions(formattedMed1);
  
  // Function to check if medication names match accounting for formatting differences
  const matchesMedication = (apiMed: string, inputMed: string) => {
    const formattedApiMed = prepareMedicationNameForApi(apiMed);
    const formattedInputMed = prepareMedicationNameForApi(inputMed);
    return formattedApiMed.toLowerCase() === formattedInputMed.toLowerCase();
  };
  
  const suppAiInteraction = suppAiResults.find(
    int => matchesMedication(int.drug1, formattedMed2) || 
           matchesMedication(int.drug2, formattedMed2)
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
