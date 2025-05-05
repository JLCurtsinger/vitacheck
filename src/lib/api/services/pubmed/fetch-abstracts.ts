/**
 * PubMed Abstract Fetching Service
 * Handles fetching abstracts from the PubMed/Entrez E-Utilities API
 * via Netlify function to keep API keys secure
 */

/**
 * Fetches abstracts from PubMed articles based on their IDs
 * 
 * @param ids - Array of PubMed article IDs 
 * @returns Combined text of all abstracts found, or empty string if none found or error occurs
 */
export async function fetchPubMedAbstracts(ids: string[]): Promise<string> {
  try {
    // If no IDs are provided, return empty string
    if (!ids || ids.length === 0) {
      console.log(`ℹ️ [PubMed] No IDs provided for abstract fetching`);
      return '';
    }

    // Join the IDs into a comma-separated string
    const idsString = ids.join(',');
    
    // Use Netlify function to fetch abstracts while keeping API key secure
    const response = await fetch('/.netlify/functions/pubmedSearch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: `uid:${idsString}`
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
      return '';
    }
    
    // Get the abstract text
    const abstracts = data?.abstracts || '';
    
    if (!abstracts || abstracts.trim() === '') {
      console.log(`ℹ️ [PubMed] No abstracts found for the provided IDs`);
      return '';
    }
    
    console.log(`✅ [PubMed] Successfully fetched abstracts (${abstracts.length} characters)`);
    
    return abstracts;
    
  } catch (error) {
    // Log the error but don't throw - return empty string instead
    console.error('Error fetching PubMed abstracts:', error);
    return '';
  }
}
