
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
  
  // Check if interactions were found
  if (rxnormInteractions.length > 0 && 
      rxnormInteractions[0]?.fullInteractionType && 
      rxnormInteractions[0]?.fullInteractionType.length > 0) {
    
    const description = rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || "";
    
    // If we have an interaction description, it's a minor interaction at minimum
    if (description) {
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
  }
  
  // If RxNorm explicitly confirms no interactions
  // This case happens when RxNorm returns a response but with empty interaction data
  // This indicates that RxNorm knows about these medications but found no interactions
  if (rxnormInteractions.length === 0) {
    return {
      sources: [{
        name: "RxNorm",
        severity: "safe",
        description: "No interactions found in RxNorm database"
      }],
      description: "No interactions found in RxNorm database. Always consult your healthcare provider.",
      severity: "safe"
    };
  }
  
  // Default case - we don't have clear information
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
