
import { corsHeaders } from '../utils/cors-utils';

/**
 * Makes a direct request to RxNorm API
 * @param apiUrl - Complete URL for the RxNorm API call
 */
export async function makeRxNormApiRequest(apiUrl: string): Promise<any> {
  console.log(`🌐 RxNorm: Making API request to: ${apiUrl}`);
  
  try {
    // Make request to RxNorm API
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RxNorm: API error (${response.status}):`, errorText);
      
      return {
        statusCode: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `RxNorm API error (${response.status})`,
          details: errorText || response.statusText,
          status: 'error'
        })
      };
    }
    
    const data = await response.json();
    console.log(`✅ RxNorm: API response:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        status: 'success'
      })
    };
  } catch (error) {
    console.error('❌ RxNorm: Error in API request:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack,
        status: 'error'
      })
    };
  }
}
