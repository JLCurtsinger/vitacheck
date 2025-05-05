
import { Handler } from '@netlify/functions';

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  try {
    // Parse the request body to get the search term
    const { searchTerm } = JSON.parse(event.body || '{}');

    if (!searchTerm) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing searchTerm in request body' }),
      };
    }

    // Get the API key from environment variables
    const apiKey = process.env.VITE_ENTREZ_API_KEY || '';
    
    // Construct the search query - encode the term to handle special characters
    const encodedTerm = encodeURIComponent(`${searchTerm} drug interaction`);
    
    // Construct the URL with all required parameters
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedTerm}&retmode=json&retmax=3${apiKey ? `&api_key=${apiKey}` : ''}`;
    
    console.log(`🔍 [PubMed Search Function] Searching for: ${searchTerm}`);
    
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
    
    console.log(`✅ [PubMed Search Function] Found ${ids.length} articles for: ${searchTerm}`);
    
    // Return the IDs in the expected format
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({ ids }),
    };
    
  } catch (error) {
    console.error('[PubMed Search Function] Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
      body: JSON.stringify({ 
        error: 'Error fetching PubMed IDs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

export { handler };
