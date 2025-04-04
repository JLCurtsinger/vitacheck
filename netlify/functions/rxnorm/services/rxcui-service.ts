
import { formatMedicationName } from '../utils/medication-utils';

// Local cache of known generic drug → RxCUI mappings
// This duplicates the cache in the frontend for server-side fallback
const knownRxCUI: Record<string, string> = {
  "alprazolam": "197361",
  "warfarin": "11289",
  "atorvastatin": "83367",
  "ibuprofen": "5640",
  "lisinopril": "29046",
  "metformin": "6809",
  "amlodipine": "17767",
  "metoprolol": "6918",
  "simvastatin": "36567",
  "omeprazole": "7646",
  "losartan": "52175",
  "albuterol": "435",
  "sertraline": "36437",
  "gabapentin": "25480",
  "fluoxetine": "4493",
  "amoxicillin": "723",
  "hydrochlorothiazide": "5487",
  "acetaminophen": "161",
  "aspirin": "1191",
  "levothyroxine": "10582",
};

/**
 * Generate alternative name formats for a medication
 */
function generateAlternativeFormats(name: string): string[] {
  if (!name) return [];
  
  const originalName = name.trim();
  
  // Try different formats
  const alternativeFormats = [
    originalName,
    originalName.toLowerCase(),
    originalName.toUpperCase(),
    // Capitalize first letter
    originalName.charAt(0).toUpperCase() + originalName.slice(1).toLowerCase(),
    // Remove text in parentheses
    originalName.replace(/\s*\([^)]*\)/g, "").trim(),
  ];
  
  // Remove duplicates
  return [...new Set(alternativeFormats)];
}

/**
 * Fetches RxCUI (RxNorm Concept Unique Identifier) for a medication name
 * Enhanced with fallback mechanisms
 * @param name - Medication name to look up
 */
export async function fetchRxCUIByName(name: string): Promise<string | null> {
  console.log(`🔍 RxNorm: Fetching RxCUI for medication name: ${name}`);
  
  // Format the name for better API matching
  let rxcui: string | null = null;
  
  // Try with formatted name first
  const formattedName = formatMedicationName(name);
  console.log(`🔍 RxNorm: Using formatted name: ${formattedName}`);
  rxcui = await tryFetchRxCUI(formattedName);
  
  // If not found, check local cache
  if (!rxcui) {
    const normalizedName = name.toLowerCase().trim();
    if (knownRxCUI[normalizedName]) {
      console.log(`[RxNorm Fallback] Server using RxCUI from local cache: ${name} → ${knownRxCUI[normalizedName]}`);
      return knownRxCUI[normalizedName];
    }
  }
  
  // If still not found, try alternative formats
  if (!rxcui) {
    console.log(`[RxNorm Fallback] Server trying alternative formats for "${name}"`);
    const alternativeFormats = generateAlternativeFormats(name);
    
    for (const format of alternativeFormats) {
      if (format === formattedName) continue; // Skip if we already tried this format
      
      console.log(`[RxNorm Fallback] Server retrying with alternative format: "${format}"`);
      rxcui = await tryFetchRxCUI(format);
      
      if (rxcui) {
        console.log(`✅ [RxNorm Fallback] Server found RxCUI using alternative format "${format}": ${rxcui}`);
        break;
      }
    }
  }
  
  if (rxcui) {
    console.log(`✅ RxNorm: Found RxCUI for ${name}: ${rxcui}`);
  } else {
    console.log(`⚠️ RxNorm: No RxCUI found for ${name} after exhausting all fallback options`);
  }
  
  return rxcui;
}

/**
 * Helper function to attempt RxCUI lookup with a specific format
 */
async function tryFetchRxCUI(formattedName: string): Promise<string | null> {
  try {
    // Build URL for RxNorm API call
    const rxcuiLookupUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(formattedName)}`;
    console.log(`🌐 RxNorm: Making API request to: ${rxcuiLookupUrl}`);
    
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
      console.log(`✅ RxNorm: Found RxCUI for ${formattedName}: ${rxcui}`);
    } else {
      console.log(`⚠️ RxNorm: No RxCUI found for ${formattedName}`);
    }
    
    return rxcui;
  } catch (error) {
    console.error(`❌ RxNorm: Failed to fetch RxCUI for ${formattedName}:`, error);
    return null;
  }
}
