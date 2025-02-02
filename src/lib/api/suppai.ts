export interface SuppAiResponse {
  interactions?: Array<{
    drug1: string;
    drug2: string;
    evidence_count: number;
    label: string;
  }>;
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