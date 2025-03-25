
import { extractNutrientDepletions } from '../utils/nutrient-utils';

export interface FDALabelData {
  results?: Array<{
    warnings?: string[] | string;
    precautions?: string[] | string;
    drug_interactions?: string[] | string;
    adverse_reactions?: string[] | string;
    warnings_and_cautions?: string[] | string;
  }>;
}

export interface FDAEventData {
  meta?: {
    results?: {
      total: number;
    };
  };
  results?: Array<{
    patient?: {
      reaction?: Array<{
        reactionmeddrapt?: string;
      }>;
    };
    safetyreportid?: string;
    receivedate?: string;
    serious?: string;
    drugcharacterization?: string;
    medicinalproduct?: string;
    reactionmeddrapt?: string[];
  }>;
}

/**
 * Fetches drug label information from openFDA API to extract nutrient depletions
 */
export async function fetchDrugLabelInfo(query: string): Promise<{ nutrientDepletions: string[] }> {
  const labelUrl = `https://api.fda.gov/drug/label.json?search=${encodeURIComponent(query.trim())}&limit=5`;
  console.log('Sending request to openFDA Label API:', labelUrl);
  
  try {
    const labelResponse = await fetch(labelUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!labelResponse.ok) {
      console.error(`Error fetching label data: ${labelResponse.status} ${labelResponse.statusText}`);
      return { nutrientDepletions: [] };
    }
    
    const labelData: FDALabelData = await labelResponse.json();
    const nutrientDepletions: string[] = [];
    
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
    
    return { nutrientDepletions };
  } catch (error) {
    console.error('Error fetching label data for nutrient depletion analysis:', error);
    return { nutrientDepletions: [] };
  }
}

/**
 * Fetches adverse event data from openFDA API
 */
export async function fetchAdverseEventData(query: string): Promise<{
  reports: any[];
  total: number;
  commonReactions: string[];
  error?: string;
}> {
  const fdaUrl = `https://api.fda.gov/drug/event.json?search=${encodeURIComponent(query.trim())}&limit=10`;
  console.log('Sending request to openFDA Adverse Events API:', fdaUrl);
  
  try {
    const response = await fetch(fdaUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const responseData = await response.text();
    console.log('openFDA API response status:', response.status);
    console.log('openFDA API response body length:', responseData.length);

    if (!response.ok) {
      return {
        reports: [],
        total: 0,
        commonReactions: [],
        error: `openFDA API error (${response.status}): ${response.statusText}`
      };
    }
    
    // Try to parse the response as JSON
    try {
      const data: FDAEventData = JSON.parse(responseData);
      
      // Extract and structure relevant information
      const structuredResults = data.results?.map(result => ({
        safetyReportId: result.safetyreportid,
        receiveDate: result.receivedate,
        seriousnessDeath: result.serious,
        drugCharacterization: result.drugcharacterization,
        medicinalProduct: result.medicinalproduct,
        reactionMedDRApt: result.reactionmeddrapt
      })) || [];

      // Extract the most common reactions
      let commonReactions: string[] = [];
      if (data.results) {
        const reactionCounts = new Map<string, number>();
        
        data.results.forEach(result => {
          if (result.patient?.reaction) {
            result.patient.reaction.forEach(reaction => {
              if (reaction.reactionmeddrapt) {
                const count = reactionCounts.get(reaction.reactionmeddrapt) || 0;
                reactionCounts.set(reaction.reactionmeddrapt, count + 1);
              }
            });
          }
        });
        
        // Sort by frequency and get top reactions
        commonReactions = Array.from(reactionCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([reaction]) => reaction);
      }

      return {
        reports: structuredResults,
        total: data.meta?.results?.total || 0,
        commonReactions
      };
    } catch (e) {
      console.error('Failed to parse openFDA response as JSON:', e);
      return {
        reports: [],
        total: 0,
        commonReactions: [],
        error: "Invalid JSON response from openFDA API"
      };
    }
  } catch (error) {
    console.error('Error making request to openFDA API:', error);
    return {
      reports: [],
      total: 0,
      commonReactions: [],
      error: `Error: ${error.message}`
    };
  }
}
