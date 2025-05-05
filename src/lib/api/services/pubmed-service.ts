
/**
 * PubMed Data Service
 * Handles fetching data from the PubMed/Entrez E-Utilities API
 */

/**
 * Fetches the top 3 PubMed article IDs related to a search term and drug interactions
 * 
 * @param searchTerm - The medication or substance name to search for
 * @returns Array of PubMed IDs (e.g., ["12345678", "23456789"])
 */
export async function fetchPubMedIds(searchTerm: string): Promise<string[]> {
  try {
    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_ENTREZ_API_KEY || '';
    
    // Construct the search query - encode the term to handle special characters
    const encodedTerm = encodeURIComponent(`${searchTerm} drug interaction`);
    
    // Construct the URL with all required parameters
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedTerm}&retmode=json&retmax=3${apiKey ? `&api_key=${apiKey}` : ''}`;
    
    console.log(`🔍 [PubMed] Searching for: ${searchTerm}`);
    
    // Fetch data from the API
    const response = await fetch(url);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`PubMed API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Extract the PubMed IDs from the response
    const ids = data?.esearchresult?.idlist || [];
    
    console.log(`✅ [PubMed] Found ${ids.length} articles for: ${searchTerm}`);
    
    return ids;
    
  } catch (error) {
    // Log the error but don't throw - return empty array instead
    console.error('Error fetching PubMed IDs:', error);
    return [];
  }
}
