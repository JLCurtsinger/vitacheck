
/**
 * PubMed Abstract Summarization Service
 * Handles summarizing PubMed abstracts using Netlify serverless function
 */

/**
 * Summarizes PubMed abstracts, focusing on drug interactions for the search term
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
    
    console.log(`✅ [PubMed] Successfully received summary for: ${searchTerm} (${summary.length} characters)`);
    
    return summary;
    
  } catch (error) {
    // Log the error but don't throw - return a fallback message instead
    console.error('Error summarizing PubMed abstracts:', error);
    return `Unable to summarize scientific literature at this time. Please check other data sources for information about ${searchTerm} interactions.

This summary is based on published scientific literature and is for informational purposes only. Always consult a healthcare provider before making decisions about medications.`;
  }
}
