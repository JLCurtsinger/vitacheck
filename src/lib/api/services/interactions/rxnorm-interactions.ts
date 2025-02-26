
import { getDrugInteractions } from '../../rxnorm';
import { InteractionSource } from '../../types';

export async function checkRxNormInteractions(
  med1Id: string,
  med2Id: string,
  med1Name: string,
  med2Name: string
): Promise<{
  sources: InteractionSource[];
  description: string;
  severity: "safe" | "minor" | "severe" | "unknown";
}> {
  const rxnormInteractions = await getDrugInteractions([med1Id, med2Id]);
  
  if (rxnormInteractions.length > 0) {
    const description = rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || "";
    return {
      sources: [{
        name: "RxNorm",
        severity: "minor",
        description
      }],
      description,
      severity: "minor"
    };
  }
  
  // Check if RxNorm explicitly confirms no interactions
  if (rxnormInteractions.length === 0) {
    return {
      sources: [{
        name: "RxNorm",
        severity: "unknown",
        description: "No interaction data found in RxNorm database"
      }],
      description: "No interaction data available in RxNorm database. Consult your healthcare provider.",
      severity: "unknown"
    };
  }
  
  return {
    sources: [{
      name: "RxNorm",
      severity: "unknown",
      description: "Interaction status unknown"
    }],
    description: "No interaction data available. Consult your healthcare provider.",
    severity: "unknown"
  };
}
