// API utility functions for medication interactions

interface RxNormResponse {
  idGroup?: {
    rxnormId?: string[];
  };
}

interface RxNormInteractionResponse {
  fullInteractionTypeGroup?: Array<{
    fullInteractionType: Array<{
      interactionPair: Array<{
        description: string;
        severity?: string;
      }>;
    }>;
  }>;
}

interface SuppAiResponse {
  interactions?: Array<{
    drug1: string;
    drug2: string;
    evidence_count: number;
    label: string;
  }>;
}

interface FDAResponse {
  results?: Array<{
    warnings?: string[];
    drug_interactions?: string[];
  }>;
}

export async function getRxCUI(medication: string): Promise<string | null> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(medication)}`;
    const response = await fetch(url);
    const data: RxNormResponse = await response.json();
    return data.idGroup?.rxnormId?.[0] || null;
  } catch (error) {
    console.error('Error fetching RxCUI:', error);
    return null;
  }
}

export async function getDrugInteractions(rxCUI: string) {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis=${rxCUI}`;
    const response = await fetch(url);
    const data: RxNormInteractionResponse = await response.json();
    return data.fullInteractionTypeGroup || [];
  } catch (error) {
    console.error('Error fetching drug interactions:', error);
    return [];
  }
}

export async function getSupplementInteractions(medication: string) {
  try {
    const url = `https://supp.ai/api/agent/search?q=${encodeURIComponent(medication)}`;
    const response = await fetch(url);
    const data: SuppAiResponse = await response.json();
    return data.interactions || [];
  } catch (error) {
    console.error('Error fetching supplement interactions:', error);
    return [];
  }
}

export async function getFDAWarnings(medication: string) {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(medication)}`;
    const response = await fetch(url);
    const data: FDAResponse = await response.json();
    return data.results?.[0]?.drug_interactions || [];
  } catch (error) {
    console.error('Error fetching FDA warnings:', error);
    return [];
  }
}

export interface InteractionResult {
  medications: [string, string];
  severity: "safe" | "minor" | "severe";
  description: string;
  evidence?: string;
  sources: string[];
}

export async function checkInteractions(medications: string[]): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];
      const pairKey = [med1, med2].sort().join('-');
      
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const interactionSources: string[] = [];
      let maxSeverity: "safe" | "minor" | "severe" = "safe";
      let description = "";

      // Check RxNorm
      const [rxcui1, rxcui2] = await Promise.all([
        getRxCUI(med1),
        getRxCUI(med2)
      ]);

      if (rxcui1 && rxcui2) {
        const rxnormInteractions = await getDrugInteractions(rxcui1);
        if (rxnormInteractions.length > 0) {
          interactionSources.push("RxNorm");
          maxSeverity = "minor";
          description = rxnormInteractions[0]?.fullInteractionType?.[0]?.interactionPair?.[0]?.description || "";
        }
      }

      // Check SUPP.AI
      const suppAiResults = await getSupplementInteractions(med1);
      const suppAiInteraction = suppAiResults.find(
        int => int.drug1.toLowerCase() === med2.toLowerCase() || int.drug2.toLowerCase() === med2.toLowerCase()
      );

      if (suppAiInteraction) {
        interactionSources.push("SUPP.AI");
        if (suppAiInteraction.evidence_count > 5) {
          maxSeverity = "severe";
        }
        description = description || suppAiInteraction.label;
      }

      // Check FDA
      const fdaWarnings = await getFDAWarnings(med1);
      const hasFDAWarning = fdaWarnings.some(
        warning => warning.toLowerCase().includes(med2.toLowerCase())
      );

      if (hasFDAWarning) {
        interactionSources.push("FDA");
        maxSeverity = "severe";
        description = description || fdaWarnings[0];
      }

      // If no interactions found
      if (interactionSources.length === 0) {
        results.push({
          medications: [med1, med2],
          severity: "safe",
          description: "No known interactions detected, but consult a healthcare professional for advice.",
          sources: ["No interactions found in available databases"]
        });
        continue;
      }

      results.push({
        medications: [med1, med2],
        severity: maxSeverity,
        description,
        sources: interactionSources
      });
    }
  }

  return results;
}