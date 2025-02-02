export interface FDAResponse {
  results?: Array<{
    warnings?: string[];
    drug_interactions?: string[];
  }>;
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