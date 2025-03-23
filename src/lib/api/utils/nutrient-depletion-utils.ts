import { supabase } from "@/integrations/supabase/client";

/**
 * Interface for normalized nutrient depletion data
 */
export interface NutrientDepletion {
  medication: string;
  depletedNutrients: string[];
  sources: string[];
}

/**
 * Static dataset of known nutrient depletions
 */
const KNOWN_NUTRIENT_DEPLETIONS: Record<string, { nutrients: string[], source: string }> = {
  "metformin": { nutrients: ["Vitamin B12", "Folate"], source: "Static Dataset" },
  "omeprazole": { nutrients: ["Magnesium", "Vitamin B12", "Calcium"], source: "Static Dataset" },
  "simvastatin": { nutrients: ["Coenzyme Q10"], source: "Static Dataset" },
  "atorvastatin": { nutrients: ["Coenzyme Q10"], source: "Static Dataset" },
  "warfarin": { nutrients: ["Vitamin K"], source: "Static Dataset" },
  "hydrochlorothiazide": { nutrients: ["Potassium", "Magnesium", "Zinc"], source: "Static Dataset" },
  "prednisone": { nutrients: ["Calcium", "Vitamin D", "Potassium"], source: "Static Dataset" },
  "furosemide": { nutrients: ["Potassium", "Magnesium", "Calcium"], source: "Static Dataset" },
  "lisinopril": { nutrients: ["Zinc"], source: "Static Dataset" },
  "levothyroxine": { nutrients: ["Calcium"], source: "Static Dataset" },
  "phenytoin": { nutrients: ["Folate", "Vitamin D", "Vitamin K"], source: "Static Dataset" },
  "phenobarbital": { nutrients: ["Vitamin D", "Folate", "Vitamin K"], source: "Static Dataset" },
  "proton pump inhibitors": { nutrients: ["Vitamin B12", "Magnesium", "Calcium"], source: "Static Dataset" },
  "antacids": { nutrients: ["Iron", "Calcium"], source: "Static Dataset" },
  "antibiotics": { nutrients: ["Vitamin K", "B Vitamins"], source: "Static Dataset" },
  "oral contraceptives": { nutrients: ["Vitamin B6", "Folate", "Vitamin B12", "Vitamin C"], source: "Static Dataset" }
};

/**
 * Keywords that indicate nutrient depletion in FDA labels
 */
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

/**
 * List of common nutrients to scan for in FDA labels
 */
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
function extractDepletionsFromFDALabel(labelText: string): string[] {
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

/**
 * Check if a medication name matches or contains a key in the known depletions list
 */
function findMatchingMedication(medicationName: string): string | null {
  const normalizedMed = medicationName.toLowerCase().trim();
  
  // First check for exact match
  if (KNOWN_NUTRIENT_DEPLETIONS[normalizedMed]) {
    return normalizedMed;
  }
  
  // Then check for partial matches
  for (const key of Object.keys(KNOWN_NUTRIENT_DEPLETIONS)) {
    if (normalizedMed.includes(key) || key.includes(normalizedMed)) {
      return key;
    }
  }
  
  return null;
}

/**
 * Get nutrient depletions from static dataset for a medication
 */
export function getStaticNutrientDepletions(medicationName: string): { nutrients: string[], source: string } | null {
  const matchedMedication = findMatchingMedication(medicationName);
  
  if (matchedMedication) {
    return KNOWN_NUTRIENT_DEPLETIONS[matchedMedication];
  }
  
  return null;
}

/**
 * Get nutrient depletions from FDA label for a medication
 */
export function getFDALabelNutrientDepletions(fdaWarnings: string[]): string[] {
  const detectedDepletions: string[] = [];
  
  if (!fdaWarnings || fdaWarnings.length === 0) {
    return detectedDepletions;
  }
  
  // Process each warning text to find potential nutrient depletions
  fdaWarnings.forEach(warning => {
    const depletionsFromWarning = extractDepletionsFromFDALabel(warning);
    depletionsFromWarning.forEach(nutrient => {
      if (!detectedDepletions.includes(nutrient)) {
        detectedDepletions.push(nutrient);
      }
    });
  });
  
  return detectedDepletions;
}

/**
 * Get nutrient depletions from Supabase for a medication
 */
export async function getDatabaseNutrientDepletions(medicationName: string): Promise<{ nutrients: string[], source: string } | null> {
  if (!medicationName) return null;
  
  try {
    const normalizedMed = medicationName.toLowerCase().trim();
    
    const { data, error } = await supabase
      .from('nutrient_depletions')
      .select('depleted_nutrient, source')
      .ilike('medication_name', `%${normalizedMed}%`);
    
    if (error) {
      console.error('Error fetching nutrient depletions from database:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      const nutrients = data.map(item => item.depleted_nutrient);
      return {
        nutrients,
        source: 'Database'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in getDatabaseNutrientDepletions:', error);
    return null;
  }
}

/**
 * Save newly discovered nutrient depletions via Edge Function
 */
export async function saveNutrientDepletions(depletions: NutrientDepletion[]): Promise<void> {
  try {
    for (const depletion of depletions) {
      for (const nutrient of depletion.depletedNutrients) {
        // Only use the first source for simplicity
        const source = depletion.sources[0] || 'Unknown';
        
        try {
          // Call the Edge Function instead of direct database insert
          const response = await fetch('/.netlify/functions/logNutrientDepletion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              medication_name: depletion.medication.toLowerCase(),
              depleted_nutrient: nutrient,
              source: source
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error saving nutrient depletion via Edge Function:', errorData);
          }
        } catch (error) {
          console.error('Error calling logNutrientDepletion Edge Function:', error);
          // Continue with the loop even if one request fails
        }
      }
    }
  } catch (error) {
    console.error('Error in saveNutrientDepletions:', error);
    // Don't throw the error - just log it to prevent UI breakage
  }
}

/**
 * Normalize and aggregate nutrient depletion data from multiple sources
 */
export function normalizeNutrientDepletions(
  medications: string[], 
  staticData: Record<string, { nutrients: string[], source: string }>,
  fdaData: Record<string, { nutrients: string[], source: string }>,
  dbData: Record<string, { nutrients: string[], source: string }>
): NutrientDepletion[] {
  const result: NutrientDepletion[] = [];
  
  medications.forEach(medication => {
    const depletedNutrients: string[] = [];
    const sources: string[] = [];
    
    // Add static data
    if (staticData[medication]) {
      staticData[medication].nutrients.forEach(nutrient => {
        if (!depletedNutrients.includes(nutrient)) {
          depletedNutrients.push(nutrient);
        }
      });
      if (!sources.includes(staticData[medication].source)) {
        sources.push(staticData[medication].source);
      }
    }
    
    // Add FDA data
    if (fdaData[medication]) {
      fdaData[medication].nutrients.forEach(nutrient => {
        if (!depletedNutrients.includes(nutrient)) {
          depletedNutrients.push(nutrient);
        }
      });
      if (!sources.includes(fdaData[medication].source)) {
        sources.push(fdaData[medication].source);
      }
    }
    
    // Add database data
    if (dbData[medication]) {
      dbData[medication].nutrients.forEach(nutrient => {
        if (!depletedNutrients.includes(nutrient)) {
          depletedNutrients.push(nutrient);
        }
      });
      if (!sources.includes(dbData[medication].source)) {
        sources.push(dbData[medication].source);
      }
    }
    
    // Only add to results if there are any nutrients found
    if (depletedNutrients.length > 0) {
      result.push({
        medication,
        depletedNutrients,
        sources
      });
    }
  });
  
  return result;
}

/**
 * Analyze nutrient depletions for a list of medications
 */
export async function analyzeNutrientDepletions(
  medications: string[], 
  fdaWarnings: Record<string, string[]> = {}
): Promise<NutrientDepletion[]> {
  try {
    // Collect data from static dataset
    const staticData: Record<string, { nutrients: string[], source: string }> = {};
    
    // Collect data from FDA labels
    const fdaData: Record<string, { nutrients: string[], source: string }> = {};
    
    // Collect data from Supabase database
    const dbData: Record<string, { nutrients: string[], source: string }> = {};
    
    // Process each medication
    for (const med of medications) {
      // Get static dataset depletions
      const staticDepletions = getStaticNutrientDepletions(med);
      if (staticDepletions) {
        staticData[med] = staticDepletions;
      }
      
      // Get FDA label depletions
      const fdaWarningsForMed = fdaWarnings[med] || [];
      const fdaNutrients = getFDALabelNutrientDepletions(fdaWarningsForMed);
      if (fdaNutrients.length > 0) {
        fdaData[med] = { nutrients: fdaNutrients, source: "FDA Label" };
      }
      
      // Get database depletions
      const dbDepletions = await getDatabaseNutrientDepletions(med);
      if (dbDepletions) {
        dbData[med] = dbDepletions;
      }
    }
    
    // Normalize and combine all data
    const normalizedData = normalizeNutrientDepletions(medications, staticData, fdaData, dbData);
    
    // Save newly discovered depletions to the database
    await saveNutrientDepletions(normalizedData);
    
    return normalizedData;
  } catch (error) {
    console.error('Error analyzing nutrient depletions:', error);
    return [];
  }
}
