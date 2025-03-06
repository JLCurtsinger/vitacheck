
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
} | null> {
  console.log(`Checking RxNorm interactions for ${med1Name}(${med1Id}) and ${med2Name}(${med2Id})`);
  
  try {
    // Send an array of RxCUIs to the getDrugInteractions function
    const rxcuis = [med1Id, med2Id];
    const rxnormInteractions = await getDrugInteractions(rxcuis);
    
    console.log('RxNorm interaction response:', {
      interactionsFound: rxnormInteractions.length > 0,
      hasInteractionData: rxnormInteractions.length > 0 && 
                          rxnormInteractions[0]?.fullInteractionType && 
                          rxnormInteractions[0]?.fullInteractionType.length > 0
    });
    
    // Check if interactions were found
    if (rxnormInteractions.length > 0 && 
        rxnormInteractions[0]?.fullInteractionType && 
        rxnormInteractions[0]?.fullInteractionType.length > 0) {
      
      const description = rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || "";
      
      // If we have an interaction description, it's a minor interaction at minimum
      if (description) {
        // Look for severe keywords in the description
        const severeKeywords = ['severe', 'dangerous', 'fatal', 'death', 'avoid', 'contraindicated', 'life-threatening'];
        const isSevere = severeKeywords.some(keyword => description.toLowerCase().includes(keyword));
        
        return {
          sources: [{
            name: "RxNorm",
            severity: isSevere ? "severe" : "minor",
            description
          }],
          description,
          severity: isSevere ? "severe" : "minor"
        };
      }
    }
    
    // If RxNorm explicitly confirms no interactions
    // This case happens when RxNorm returns a response but with empty interaction data
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
    return null;
  } catch (error) {
    console.error('Error in RxNorm interaction check:', error);
    return null;
  }
}
