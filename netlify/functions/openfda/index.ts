
import { Handler } from '@netlify/functions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

// Keywords related to nutrient depletion in drug labels
const DEPLETION_KEYWORDS = [
  "deficiency",
  "depletion",
  "decreased",
  "reduces",
  "lowers",
  "impairs absorption",
  "interferes with",
  "malabsorption"
];

// List of common nutrients to look for
const COMMON_NUTRIENTS = [
  "Vitamin A", "Vitamin B1", "Vitamin B2", "Vitamin B3", "Vitamin B5", "Vitamin B6", 
  "Vitamin B7", "Vitamin B9", "Vitamin B12", "Vitamin C", "Vitamin D", "Vitamin E", 
  "Vitamin K", "Folate", "Folic Acid", "Calcium", "Magnesium", "Iron", "Zinc", 
  "Potassium", "Sodium", "Selenium", "Copper", "Thiamine", "Riboflavin", "Niacin",
  "Coenzyme Q10", "CoQ10"
];

/**
 * Extract potential nutrient depletions from FDA drug label text
 */
function extractNutrientDepletions(labelText: string): string[] {
  const extractedNutrients: string[] = [];
  
  if (!labelText) {
    return extractedNutrients;
  }
  
  // Convert to lowercase for case-insensitive matching
  const text = labelText.toLowerCase();
  
  // Check for each nutrient with depletion keywords
  COMMON_NUTRIENTS.forEach(nutrient => {
    const nutrientLower = nutrient.toLowerCase();
    
    // Check if any depletion keyword is near the nutrient name
    DEPLETION_KEYWORDS.forEach(keyword => {
      // Look for patterns like "vitamin b12 deficiency" or "deficiency of vitamin b12"
      const pattern1 = new RegExp(`${nutrientLower}\\s+${keyword}`, 'i');
      const pattern2 = new RegExp(`${keyword}\\s+of\\s+${nutrientLower}`, 'i');
      const pattern3 = new RegExp(`${keyword}\\s+${nutrientLower}`, 'i');
      
      if (pattern1.test(text) || pattern2.test(text) || pattern3.test(text)) {
        if (!extractedNutrients.includes(nutrient)) {
          extractedNutrients.push(nutrient);
        }
      }
    });
  });
  
  return extractedNutrients;
}

const handler: Handler = async (event) => {
  console.log('Received openFDA request:', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : null
  });

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    if (!event.body) {
      console.error('Request body is missing');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Request body is required",
          status: "error"
        })
      };
    }

    const { query } = JSON.parse(event.body);
    console.log('Processing openFDA request:', { query });

    if (!query) {
      console.error('Query parameter is missing');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: "Query parameter is required",
          status: "error"
        })
      };
    }

    try {
      // First, try to get drug label information for nutrient depletions
      const labelUrl = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query.trim())}&limit=5`;
      console.log('Sending request to openFDA Label API:', labelUrl);
      
      let nutrientDepletions: string[] = [];
      
      try {
        const labelResponse = await fetch(labelUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (labelResponse.ok) {
          const labelData = await labelResponse.json();
          
          // Process each result to find potential nutrient depletions
          if (labelData.results) {
            for (const result of labelData.results) {
              // Check sections likely to mention nutrient depletions
              const sectionsToCheck = [
                result.warnings,
                result.precautions,
                result.drug_interactions,
                result.adverse_reactions,
                result.warnings_and_cautions
              ];
              
              for (const section of sectionsToCheck) {
                if (section && typeof section === 'string') {
                  const foundNutrients = extractNutrientDepletions(section);
                  
                  foundNutrients.forEach(nutrient => {
                    if (!nutrientDepletions.includes(nutrient)) {
                      nutrientDepletions.push(nutrient);
                    }
                  });
                } else if (Array.isArray(section)) {
                  for (const item of section) {
                    if (typeof item === 'string') {
                      const foundNutrients = extractNutrientDepletions(item);
                      
                      foundNutrients.forEach(nutrient => {
                        if (!nutrientDepletions.includes(nutrient)) {
                          nutrientDepletions.push(nutrient);
                        }
                      });
                    }
                  }
                }
              }
            }
          }
        }
      } catch (labelError) {
        console.error('Error fetching label data for nutrient depletion analysis:', labelError);
        // Continue with adverse events query even if label query fails
      }

      // Now get adverse event data as before
      const fdaUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(query.trim())}&limit=10`;
      console.log('Sending request to openFDA Adverse Events API:', fdaUrl);
      
      const response = await fetch(fdaUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.text();
      console.log('openFDA API response status:', response.status);
      console.log('openFDA API response headers:', response.headers);
      console.log('openFDA API response body length:', responseData.length);

      if (!response.ok) {
        return {
          statusCode: response.status,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: `openFDA API error (${response.status})`,
            details: responseData || response.statusText,
            status: "error",
            nutrientDepletions: nutrientDepletions
          })
        };
      }
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseData);
      } catch (e) {
        console.error('Failed to parse openFDA response as JSON:', e);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ 
            error: "Invalid JSON response from openFDA API",
            details: responseData,
            status: "error",
            nutrientDepletions: nutrientDepletions
          })
        };
      }

      // Extract and structure relevant information
      const structuredResults = data.results?.map(result => ({
        safetyReportId: result.safetyreportid,
        receiveDate: result.receivedate,
        seriousnessDeath: result.serious,
        drugCharacterization: result.drugcharacterization,
        medicinalProduct: result.medicinalproduct,
        reactionMedDRApt: result.reactionmeddrapt
      })) || [];

      // Return structured response with nutrient depletions
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: "success",
          data: {
            reports: structuredResults,
            query: query,
            total: data.meta?.results?.total || 0,
            nutrientDepletions: nutrientDepletions
          }
        })
      };

    } catch (error) {
      console.error('Error making request to openFDA API:', error);
      throw error;
    }

  } catch (error) {
    console.error("Unhandled error in openFDA function:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack,
        status: "error"
      })
    };
  }
};

export { handler };
