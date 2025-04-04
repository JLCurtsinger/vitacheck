
import { formatMedicationName } from '../utils/medication-utils';
import { supabase } from '../utils/supabase-client';
import { normalizeMedicationName } from '../utils/name-utils';

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
 * Store a successfully found RxCUI in the database for future lookups
 */
async function storeRxCUIInDatabase(name: string, rxcui: string): Promise<void> {
  try {
    // Normalize the name for consistent storage
    const normalizedName = normalizeMedicationName(name);
    
    // Check if this medication name already exists in the database
    const { data: existing } = await supabase
      .from('medication_names')
      .select('rxcui')
      .eq('name', normalizedName)
      .maybeSingle();
    
    if (existing) {
      // If the RxCUI has changed, update the record
      if (existing.rxcui !== rxcui) {
        console.log(`Updating stored RxCUI for "${normalizedName}" from ${existing.rxcui} to ${rxcui}`);
        await supabase
          .from('medication_names')
          .update({ rxcui })
          .eq('name', normalizedName);
      }
    } else {
      // Insert new record
      console.log(`Storing new RxCUI mapping: "${normalizedName}" → ${rxcui}`);
      await supabase
        .from('medication_names')
        .insert([{ name: normalizedName, rxcui }]);
    }
  } catch (error) {
    console.error(`Failed to store RxCUI in database:`, error);
    // Non-critical error, we can continue without stopping execution
  }
}

/**
 * Look up a stored RxCUI from the database
 */
async function getStoredRxCUI(name: string): Promise<string | null> {
  try {
    // Normalize the name for consistent lookup
    const normalizedName = normalizeMedicationName(name);
    
    console.log(`[RxNorm Fallback] Looking up stored RxCUI for "${normalizedName}"`);
    
    const { data, error } = await supabase
      .from('medication_names')
      .select('rxcui')
      .eq('name', normalizedName)
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      return null;
    }
    
    console.warn(`[RxNorm Fallback ⚠️] Using stored RxCUI from Supabase for ${name}: ${data.rxcui}`);
    return data.rxcui;
  } catch (error) {
    console.error(`Failed to get stored RxCUI from database:`, error);
    return null;
  }
}

/**
 * Fetches RxCUI (RxNorm Concept Unique Identifier) for a medication name
 * Enhanced with fallback mechanisms
 * @param name - Medication name to look up
 */
export async function fetchRxCUIByName(name: string): Promise<string | null> {
  console.log(`🔍 RxNorm: Fetching RxCUI for medication name: ${name}`);
  
  // Try with formatted name first
  const formattedName = formatMedicationName(name);
  console.log(`🔍 RxNorm: Using formatted name: ${formattedName}`);
  let rxcui = await tryFetchRxCUI(formattedName);
  
  // If found via API, store it in the database for future lookups
  if (rxcui) {
    await storeRxCUIInDatabase(name, rxcui);
    return rxcui;
  }
  
  // If not found, try alternative formats
  if (!rxcui) {
    console.log(`[RxNorm Fallback] Server trying alternative formats for "${name}"`);
    const alternativeFormats = generateAlternativeFormats(name);
    
    for (const format of alternativeFormats) {
      if (format === formattedName) continue; // Skip if we already tried this format
      
      console.log(`[RxNorm Fallback] Server retrying with alternative format: "${format}"`);
      rxcui = await tryFetchRxCUI(format);
      
      if (rxcui) {
        console.log(`✅ [RxNorm Fallback] Server found RxCUI using alternative format "${format}": ${rxcui}`);
        // Store the successful alternative format in the database
        await storeRxCUIInDatabase(name, rxcui);
        break;
      }
    }
  }
  
  // If still not found, try getting from the database
  if (!rxcui) {
    rxcui = await getStoredRxCUI(name);
  }
  
  if (rxcui) {
    console.log(`✅ RxNorm: Found RxCUI for ${name}: ${rxcui}`);
  } else {
    console.warn(`⚠️ RxNorm: No RxCUI found for ${name} — all lookups failed`);
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
