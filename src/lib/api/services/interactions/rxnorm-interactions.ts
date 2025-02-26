
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
  
  return {
    sources: [{
      name: "RxNorm",
      severity: "safe",
      description: "No known interactions detected"
    }],
    description: "No known interactions detected between these medications in RxNorm database.",
    severity: "safe"
  };
}
