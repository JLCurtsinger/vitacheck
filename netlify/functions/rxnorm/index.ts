
import { Handler } from "@netlify/functions";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Fetches RxCUI (RxNorm Concept Unique Identifier) for a medication name
 * @param name - Medication name to look up
 */
async function fetchRxCUIByName(name: string): Promise<string | null> {
  console.log(`🔍 RxNorm: Fetching RxCUI for medication name: ${name}`);
  
  // Build URL for RxNorm API call
  const rxcuiLookupUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name.trim())}`;
  console.log(`🌐 RxNorm: Making API request to: ${rxcuiLookupUrl}`);
  
  try {
    const response = await fetch(rxcuiLookupUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ RxNorm: Error fetching RxCUI (${response.status})`);
      return null;
    }
    
    const data = await response.json();
    console.log(`⚙️ RxNorm: RxCUI lookup response:`, data);
    
    // Extract RxCUI from response
    const rxcui = data?.idGroup?.rxnormId?.[0] || null;
    
    if (rxcui) {
      console.log(`✅ RxNorm: Found RxCUI for ${name}: ${rxcui}`);
    } else {
      console.log(`⚠️ RxNorm: No RxCUI found for ${name}`);
    }
    
    return rxcui;
  } catch (error) {
    console.error(`❌ RxNorm: Failed to fetch RxCUI for ${name}:`, error);
    return null;
  }
}

const handler: Handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Request body is missing',
          status: 'error'
        })
      };
    }
    
    const { operation, name, rxcui, rxcuis } = JSON.parse(event.body);
    
    // Support both rxcui and rxcuis parameters for better compatibility
    let resolvedRxcui = rxcui || rxcuis;
    
    console.log(`🔍 RxNorm: Processing ${operation} request:`, { 
      name, 
      rxcui: resolvedRxcui,
      body: event.body
    });
    
    // Validate required parameters
    if (!operation) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Operation parameter is required',
          status: 'error'
        })
      };
    }
    
    let apiUrl = '';
    
    // Handle different operation types
    switch (operation) {
      case 'rxcui':
        if (!name) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              error: 'Name parameter is required for rxcui operation',
              status: 'error'
            })
          };
        }
        
        apiUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`;
        break;
        
      case 'interactions':
        // If rxcui is missing but name is provided, try to fetch the rxcui first
        if (!resolvedRxcui && name) {
          console.log(`🔍 RxNorm: RxCUI missing for interactions. Attempting to fetch RxCUI for: ${name}`);
          
          resolvedRxcui = await fetchRxCUIByName(name);
          
          if (!resolvedRxcui) {
            return {
              statusCode: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                error: 'Could not find RxCUI for the given medication name',
                status: 'error',
                medication: name
              })
            };
          }
          
          console.log(`✅ RxNorm: Successfully resolved RxCUI for ${name}: ${resolvedRxcui}`);
        }
        
        if (!resolvedRxcui) {
          return {
            statusCode: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              error: 'RxCUI parameter is required for interactions operation',
              status: 'error'
            })
          };
        }
        
        apiUrl = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${resolvedRxcui}`;
        break;
        
      default:
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Invalid operation',
            status: 'error'
          })
        };
    }
    
    console.log(`🌐 RxNorm: Making API request to: ${apiUrl}`);
    
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
    console.log(`✅ RxNorm: API response for ${operation}:`, JSON.stringify(data).substring(0, 200) + '...');
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        status: 'success'
      })
    };
    
  } catch (error) {
    console.error('❌ RxNorm: Error in proxy:', error);
    
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
};

export { handler };
