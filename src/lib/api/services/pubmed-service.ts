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

/**
 * Summarizes PubMed abstracts using OpenAI, focusing on drug interactions for the search term
 * 
 * @param abstractText - The combined text of PubMed abstracts to summarize
 * @param searchTerm - The medication or substance name to focus on
 * @returns Summarized text highlighting drug interactions, or fallback message if summarization fails
 */
export async function summarizePubMedAbstracts(abstractText: string, searchTerm: string): Promise<string> {
  try {
    // If no abstract text is provided, return a message
    if (!abstractText || abstractText.trim() === '') {
      console.log(`ℹ️ [PubMed] No abstract text provided for summarization`);
      return 'No scientific literature was found for this substance or medication.';
    }

    console.log(`🔍 [PubMed] Sending abstracts for summarization: ${searchTerm}`);
    
    // Make a POST request to the Netlify function
    const response = await fetch('/.netlify/functions/summarizePubMed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        abstractText,
        searchTerm
      })
    });
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Netlify function error: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Get the summary from the response
    const summary = data.summary || 'Unable to generate summary.';
    
    console.log(`✅ [PubMed] Successfully received summary for: ${searchTerm}`);
    
    return summary;
    
  } catch (error) {
    // Log the error but don't throw - return a fallback message instead
    console.error('Error summarizing PubMed abstracts:', error);
    return `Unable to summarize scientific literature at this time. Please check the original sources for information about ${searchTerm} interactions.

This summary is based on published scientific literature and is for informational purposes only. Always consult a healthcare provider before making decisions about medications.`;
  }
}
