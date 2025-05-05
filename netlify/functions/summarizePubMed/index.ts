
import { Handler } from '@netlify/functions';

// Define the request body type
interface RequestBody {
  abstractText: string;
  searchTerm: string;
}

// Define the response body type
interface ResponseBody {
  summary: string;
}

const handler: Handler = async (event) => {
  // Set up CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse the request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing request body' })
      };
    }

    const { abstractText, searchTerm }: RequestBody = JSON.parse(event.body);

    // Validate required fields
    if (!searchTerm) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'searchTerm is required' })
      };
    }

    // If no abstract text is provided, return a message
    if (!abstractText || abstractText.trim() === '') {
      console.log(`ℹ️ [PubMed] No abstract text provided for summarization`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          summary: 'No scientific literature was found for this substance or medication.' 
        })
      };
    }

    // Get the OpenAI API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    
    // If no API key is available, return an error
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API configuration error',
          summary: 'Unable to summarize scientific literature at this time.' 
        })
      };
    }
    
    console.log(`🔍 [PubMed] Summarizing abstracts for: ${searchTerm}`);
    
    // Construct the prompt for the OpenAI API
    const prompt = `Summarize the following PubMed abstracts. Focus only on interactions involving ${searchTerm} and medications. Identify risks, affected drugs, and mechanisms if mentioned. Keep the summary concise and informative.\n\n${abstractText}`;
    
    // Prepare the request options
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes medical literature about drug interactions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    };
    
    // Make the API call to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', requestOptions);
    
    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Extract the summary text from the response
    const summaryText = data.choices[0]?.message?.content || 'Unable to generate summary.';
    
    // Add the disclaimer to the summary
    const finalSummary = `${summaryText}\n\nThis summary is based on published scientific literature and is for informational purposes only. Always consult a healthcare provider before making decisions about medications.`;
    
    console.log(`✅ [PubMed] Successfully summarized abstracts for: ${searchTerm}`);
    
    // Return the summary
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary: finalSummary })
    };
    
  } catch (error) {
    // Log the error and return a fallback message
    console.error('Error summarizing PubMed abstracts:', error);
    
    const searchTerm = event.body ? JSON.parse(event.body).searchTerm : 'this substance';
    const fallbackSummary = `Unable to summarize scientific literature at this time. Please check the original sources for information about ${searchTerm} interactions.\n\nThis summary is based on published scientific literature and is for informational purposes only. Always consult a healthcare provider before making decisions about medications.`;
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        summary: fallbackSummary 
      })
    };
  }
};

export { handler };
