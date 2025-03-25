
import { makeOpenFDARequest, buildOpenFDAUrl } from './api-client';
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

/**
 * Fetches drug label information from openFDA API to extract nutrient depletions
 * @param query - Medication name to search for
 * @returns Object containing array of identified nutrient depletions
 */
export async function fetchDrugLabelInfo(query: string): Promise<{ nutrientDepletions: string[] }> {
  console.log('Fetching drug label info for nutrient depletions:', query);
  
  try {
    const labelUrl = buildOpenFDAUrl('drug/label', query, 5);
    const labelData: FDALabelData = await makeOpenFDARequest<FDALabelData>(labelUrl);
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
