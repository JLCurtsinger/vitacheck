
import { getDrugInteractions } from '../../rxnorm';
import { InteractionSource } from '../../types';
import { detectSeverityFromDescription } from './utils/severity-detector';
import { formatInteractionResponse } from './utils/response-formatter';

// Debug flag check
const isDebug = typeof window !== 'undefined' ? 
  localStorage.getItem('DEBUG') === 'true' : 
  process.env.DEBUG === 'true';

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
  
  if (isDebug) {
    console.log('RxNorm interaction response:', {
      interactionsFound: rxnormInteractions.length > 0,
      hasInteractionData
    });
  }
  
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
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
} | null> {
  if (isDebug) {
    console.log(`Checking RxNorm interactions for ${med1Name}(${med1Id}) and ${med2Name}(${med2Id})`);
  }
  
  try {
    // Pass med1Id and med2Id as separate array elements, never concatenated
    const rxcuis = [med1Id, med2Id].filter(Boolean);
    console.log(`[RxNorm Interactions] Checking interactions for ${med1Name}(${med1Id}) + ${med2Name}(${med2Id})`);
    const rxnormInteractions = await getDrugInteractions(rxcuis);
    console.log(`[RxNorm Interactions] Received ${rxnormInteractions.length} interaction groups for ${med1Name} + ${med2Name}`);
    
    const { hasInteractions, description } = processRxNormInteractionData(rxnormInteractions);
    
    // If we have an interaction description, determine its severity
    if (hasInteractions) {
      // Determine severity based on description keywords
      const severity = detectSeverityFromDescription(description);
      
      const source: InteractionSource = {
        name: "RxNorm",
        severity: severity,
        description: description,
        confidence: 90 // High confidence for RxNorm
      };
      
      return {
        sources: [source],
        description,
        severity
      };
    }
    
    // If RxNorm explicitly confirms no interactions
    // This case happens when RxNorm returns a response but with empty interaction data
    if (rxnormInteractions.length === 0) {
      const source: InteractionSource = {
        name: "RxNorm",
        severity: "safe",
        description: "No interactions found in RxNorm database. Always consult your healthcare provider.",
        confidence: 90 // High confidence for RxNorm
      };
      
      return {
        sources: [source],
        description: "No interactions found in RxNorm database. Always consult your healthcare provider.",
        severity: "safe"
      };
    }
    
    // Default case - we don't have clear information
    return null;
  } catch (error) {
    console.error(`[RxNorm Interactions] Error checking interactions for ${med1Name} + ${med2Name}:`, error);
    // Always return null (not throw) to prevent blocking the pipeline
    return null;
  }
}
