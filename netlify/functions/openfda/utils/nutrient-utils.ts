
import { DEPLETION_KEYWORDS, COMMON_NUTRIENTS } from '../constants';

/**
 * Extract potential nutrient depletions from FDA drug label text
 */
export function extractNutrientDepletions(labelText: string): string[] {
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
