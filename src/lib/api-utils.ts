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

export interface MedicationLookupResult {
  found: boolean;
  source?: 'RxNorm' | 'SUPP.AI' | 'FDA';
  id?: string;
  warnings?: string[];
}

export async function lookupMedication(medication: string): Promise<MedicationLookupResult> {
  // Try RxNorm first
  try {
    const rxCUI = await getRxCUI(medication);
    if (rxCUI) {
      return { found: true, source: 'RxNorm', id: rxCUI };
    }
  } catch (error) {
    console.error('RxNorm lookup failed:', error);
  }

  // Try SUPP.AI next
  try {
    const suppAiResult = await getSupplementInteractions(medication);
    if (suppAiResult && suppAiResult.length > 0) {
      return { found: true, source: 'SUPP.AI' };
    }
  } catch (error) {
    console.error('SUPP.AI lookup failed:', error);
  }

  // Try FDA as last resort
  try {
    const fdaResult = await getFDAWarnings(medication);
    if (fdaResult && fdaResult.results && fdaResult.results.length > 0) {
      return {
        found: true,
        source: 'FDA',
        warnings: fdaResult.results[0].drug_interactions || []
      };
    }
  } catch (error) {
    console.error('FDA lookup failed:', error);
  }

  // If all lookups fail
  return { found: false };
}

export async function getRxCUI(medication: string): Promise<string | null> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(medication)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: RxNormResponse = await response.json();
    return data.idGroup?.rxnormId?.[0] || null;
  } catch (error) {
    console.error('Error fetching RxCUI:', error);
    return null;
  }
}

export async function getDrugInteractions(rxCUI: string) {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxCUI}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: SuppAiResponse = await response.json();
    return data.interactions || [];
  } catch (error) {
    console.error('Error fetching supplement interactions:', error);
    return [];
  }
}

export async function getFDAWarnings(medication: string): Promise<FDAResponse> {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(medication)}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: FDAResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching FDA warnings:', error);
    return { results: [] };
  }
}

export interface InteractionResult {
  medications: [string, string];
  severity: "safe" | "minor" | "severe" | "unknown";
  description: string;
  evidence?: string;
  sources: string[];
}

export async function checkInteractions(medications: string[]): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  const processedPairs = new Set<string>();
  const medicationStatuses = new Map<string, MedicationLookupResult>();

  // First, lookup all medications
  for (const med of medications) {
    medicationStatuses.set(med, await lookupMedication(med));
  }

  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i];
      const med2 = medications[j];
      const pairKey = [med1, med2].sort().join('-');
      
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const med1Status = medicationStatuses.get(med1)!;
      const med2Status = medicationStatuses.get(med2)!;

      // If either medication is not found, return unknown status
      if (!med1Status.found || !med2Status.found) {
        results.push({
          medications: [med1, med2],
          severity: "unknown",
          description: `One or more medications not found in available databases. Please consult a healthcare provider.`,
          sources: ["No data available"]
        });
        continue;
      }

      const interactionSources: string[] = [];
      let maxSeverity: "safe" | "minor" | "severe" | "unknown" = "safe";
      let description = "";

      // Check interactions based on available sources
      if (med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm') {
        const rxnormInteractions = await getDrugInteractions(med1Status.id!);
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

      // Check FDA warnings if available
      if (med1Status.warnings?.length || med2Status.warnings?.length) {
        interactionSources.push("FDA");
        const relevantWarnings = [...(med1Status.warnings || []), ...(med2Status.warnings || [])];
        if (relevantWarnings.length > 0) {
          maxSeverity = "severe";
          description = description || relevantWarnings[0];
        }
      }

      // If no interactions found but medications exist in databases
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
