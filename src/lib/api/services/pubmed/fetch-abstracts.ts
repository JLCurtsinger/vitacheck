
/**
 * PubMed Abstract Fetching Service
 * Handles fetching abstracts from the PubMed/Entrez E-Utilities API
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

    // Get the API key from environment variables
    const apiKey = import.meta.env.VITE_ENTREZ_API_KEY || '';
    
    // Join the IDs into a comma-separated string
    const idString = ids.join(',');
    
    // Construct the URL with all required parameters
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idString}&rettype=abstract&retmode=xml${apiKey ? `&api_key=${apiKey}` : ''}`;
    
    console.log(`🔍 [PubMed] Fetching abstracts for IDs: ${idString}`);
    
    // Fetch data from the API
    const response = await fetch(url);
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`PubMed API error: ${response.status} ${response.statusText}`);
    }
    
    // Get the XML text from the response
    const xmlText = await response.text();
    
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    // Extract all AbstractText elements
    const abstractElements = xmlDoc.querySelectorAll('AbstractText');
    
    // If no abstracts found, return empty string
    if (abstractElements.length === 0) {
      console.log(`ℹ️ [PubMed] No abstracts found for the provided IDs`);
      return '';
    }
    
    // Combine all abstracts into a single string
    const abstracts: string[] = [];
    abstractElements.forEach((element) => {
      if (element.textContent) {
        abstracts.push(element.textContent.trim());
      }
    });
    
    const combinedAbstracts = abstracts.join('\n\n');
    
    console.log(`✅ [PubMed] Successfully fetched ${abstracts.length} abstract sections`);
    
    return combinedAbstracts;
    
  } catch (error) {
    // Log the error but don't throw - return empty string instead
    console.error('Error fetching PubMed abstracts:', error);
    return '';
  }
}
