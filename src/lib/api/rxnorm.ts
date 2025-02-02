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