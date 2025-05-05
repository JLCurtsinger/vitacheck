/**
 * PubMed ID Fetching Service
 * Handles fetching article IDs from the PubMed/Entrez E-Utilities API
 * via Netlify function to keep API keys secure
 */

/**
 * Fetches the top 3 PubMed article IDs related to a search term and drug interactions
 * 
 * @param searchTerm - The medication or substance name to search for
 * @returns Array of PubMed IDs (e.g., ["12345678", "23456789"])
 */
export async function fetchPubMedIds(searchTerm: string): Promise<string[]> {
  try {
    // Use Netlify function to keep API key secure
    const response = await fetch('/.netlify/functions/pubmedSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `${searchTerm} drug interaction`,
        limit: 5
      })
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PubMed Search API error: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    if (data.error) {
      console.error(`PubMed Search error: ${data.error}`);
      return [];
    }
    
    // Extract the PubMed IDs from the response
    const ids = data?.ids || [];
    
    console.log(`✅ [PubMed] Found ${ids.length} articles for: ${searchTerm}`);
    
    return ids;
    
  } catch (error) {
    // Log the error but don't throw - return empty array instead
    console.error('Error fetching PubMed IDs:', error);
    return [];
  }
}
