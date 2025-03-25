
/**
 * OpenFDA API Client
 * Provides a reusable interface for making requests to the OpenFDA API endpoints
 */

/**
 * Make a request to the OpenFDA API
 * @param url - The full URL to request
 * @returns The response data
 */
export async function makeOpenFDARequest<T>(url: string): Promise<T> {
  console.log('Sending request to openFDA API:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const status = response.status;
    const statusText = response.statusText;
    console.error(`Error from openFDA API (${status}): ${statusText}`);
    
    if (status === 404) {
      // For 404 responses, return an empty result rather than throwing
      return {} as T;
    }
    
    throw new Error(`OpenFDA API error (${status}): ${statusText}`);
  }
  
  return await response.json() as T;
}

/**
 * Build a search URL for the openFDA API
 * @param endpoint - API endpoint (e.g., 'drug/label', 'drug/event')
 * @param query - Search query term
 * @param limit - Maximum number of results to return
 * @returns The complete OpenFDA API URL
 */
export function buildOpenFDAUrl(endpoint: string, query: string, limit: number = 10): string {
  return `https://api.fda.gov/${endpoint}.json?search=${encodeURIComponent(query.trim())}&limit=${limit}`;
}
