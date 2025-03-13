
import { getDrugInteractions } from '../../rxnorm';
import { InteractionSource } from '../../types';
import { detectSeverityFromDescription } from './utils/severity-detector';
import { formatInteractionResponse } from './utils/response-formatter';

/**
 * Processes RxNorm interaction data to extract information
 */
function processRxNormInteractionData(rxnormInteractions: any[]): {
  hasInteractions: boolean;
  description: string;
} {
  const hasInteractionData = rxnormInteractions.length > 0 && 
                             rxnormInteractions[0]?.fullInteractionType && 
                             rxnormInteractions[0]?.fullInteractionType.length > 0;
  
  console.log('RxNorm interaction response:', {
    interactionsFound: rxnormInteractions.length > 0,
    hasInteractionData
  });
  
  // Extract description if available
  const description = hasInteractionData
    ? rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || ""
    : "";
  
  return {
    hasInteractions: hasInteractionData && description.length > 0,
    description
  };
}

/**
 * Checks for interactions between medications using RxNorm API
 */
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
    
    const { hasInteractions, description } = processRxNormInteractionData(rxnormInteractions);
    
    // If we have an interaction description, it's a minor interaction at minimum
    if (hasInteractions) {
      // Determine severity based on description keywords
      const severity = detectSeverityFromDescription(description);
      return formatInteractionResponse("RxNorm", severity, description);
    }
    
    // If RxNorm explicitly confirms no interactions
    // This case happens when RxNorm returns a response but with empty interaction data
    if (rxnormInteractions.length === 0) {
      return formatInteractionResponse(
        "RxNorm", 
        "safe", 
        "No interactions found in RxNorm database. Always consult your healthcare provider."
      );
    }
    
    // Default case - we don't have clear information
    return null;
  } catch (error) {
    console.error('Error in RxNorm interaction check:', error);
    return null;
  }
}
