
import { Handler } from '@netlify/functions';

interface RequestBody {
  query: string;
  limit?: number;
}

interface PubMedSearchResponse {
  ids?: string[];
  abstracts?: string;
  error?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

const handler: Handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { query, limit = 3 } = JSON.parse(event.body) as RequestBody;

    if (!query) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Query parameter is required' })
      };
    }
    
    console.log(`PubMed Search: Querying for "${query}" with limit ${limit}`);
    
    // Get the API key from environment variables
    const apiKey = process.env.VITE_ENTREZ_API_KEY || '';
    if (!apiKey) {
      console.warn('No Entrez API key found in environment variables');
    }
    
    // Construct the search query - encode the term to handle special characters
    const encodedTerm = encodeURIComponent(query);
    
    // Construct the URL with all required parameters
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedTerm}&retmode=json&retmax=${limit}${apiKey ? `&api_key=${apiKey}` : ''}`;
    
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
    
    console.log(`PubMed Search: Found ${ids.length} results for "${query}"`);
    
    // If IDs were found, fetch the abstracts
    let abstracts = '';
    
    if (ids.length > 0) {
      // Join the IDs into a comma-separated string
      const idString = ids.join(',');
      
      // Construct the URL for fetching abstracts
      const abstractUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${idString}&rettype=abstract&retmode=text${apiKey ? `&api_key=${apiKey}` : ''}`;
      
      // Fetch abstracts
      const abstractResponse = await fetch(abstractUrl);
      
      if (abstractResponse.ok) {
        abstracts = await abstractResponse.text();
        console.log(`PubMed Search: Retrieved ${abstracts.length} characters of abstract text`);
      } else {
        console.error(`PubMed Search: Error fetching abstracts - ${abstractResponse.status}`);
      }
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ids, abstracts })
    };

  } catch (error) {
    console.error('Error in pubmedSearch function:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'An error occurred while searching PubMed',
        details: error instanceof Error ? error.message : String(error) 
      })
    };
  }
};

export { handler };
