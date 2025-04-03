
/**
 * RxNorm Fallback System
 * 
 * This module provides fallback mechanisms for retrieving RxCUIs when
 * the primary RxNorm API call fails.
 */

import { prepareMedicationNameForApi } from "@/utils/medication-formatter";
import { getGenericName, isBrandName } from "@/services/medication/brand-to-generic";
import { supabase } from "@/integrations/supabase/client";

/**
 * Normalize a medication name for consistent database lookups
 */
function normalizeMedicationName(name: string): string {
  if (!name) return '';
  
  // Convert to lowercase
  let normalized = name.toLowerCase();
  
  // Remove content inside parentheses including the parentheses
  normalized = normalized.replace(/\s*\([^)]*\)/g, '');
  
  // Remove special characters and excess whitespace
  normalized = normalized.replace(/[,.;:#!?'"]/g, '');
  
  // Replace multiple spaces with a single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Trim leading and trailing whitespace
  return normalized.trim();
}

/**
 * Get RxCUI from database
 * @param medication Medication name to look up
 */
export async function getRxCUIFromDatabase(medication: string): Promise<string | null> {
  if (!medication) return null;
  
  try {
    // Normalize for consistent lookup
    const normalizedName = normalizeMedicationName(medication);
    console.log(`[RxNorm Fallback] Looking up stored RxCUI for "${normalizedName}"`);
    
    const { data, error } = await supabase
      .from('medication_names')
      .select('rxcui')
      .eq('name', normalizedName)
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    console.warn(`[RxNorm Fallback ⚠️] Using stored RxCUI from database: ${medication} → ${data.rxcui}`);
    return data.rxcui;
  } catch (error) {
    console.error('[RxNorm Fallback] Database lookup failed:', error);
    return null;
  }
}

/**
 * Store a successfully found RxCUI in the database
 */
export async function storeRxCUIInDatabase(medication: string, rxcui: string): Promise<void> {
  try {
    // Normalize the name for consistent storage
    const normalizedName = normalizeMedicationName(medication);
    
    // Check if this medication name already exists
    const { data: existing } = await supabase
      .from('medication_names')
      .select('rxcui')
      .eq('name', normalizedName)
      .maybeSingle();
    
    if (existing) {
      // Only update if different
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
  }
}

/**
 * Generate alternative name formats for a medication
 * @param medication Original medication name
 */
export function generateAlternativeFormats(medication: string): string[] {
  if (!medication) return [];
  
  const originalName = medication.trim();
  const isBrand = isBrandName(originalName);
  const genericNameOnly = isBrand ? getGenericName(originalName) : originalName;
  
  // Remove form information and other details in parentheses
  const strippedNameWithoutForm = originalName.replace(/\s*\([^)]*\)/g, "").trim();
  
  // Try different formats
  const alternativeFormats = [
    originalName,
    originalName.toLowerCase(),
    genericNameOnly,
    strippedNameWithoutForm,
    genericNameOnly.toLowerCase(),
    genericNameOnly.toUpperCase(),
    // Add normalized version using our formatter utility
    prepareMedicationNameForApi(originalName)
  ];
  
  // Remove duplicates
  return [...new Set(alternativeFormats)];
}

/**
 * Process FDA Label response to extract RxCUI
 * @param fdaLabelData FDA Label API response data
 */
export function extractRxCUIFromFDALabel(fdaLabelData: any): string | null {
  if (!fdaLabelData) return null;
  
  try {
    // FDA responses can have various structures, so we need to handle them carefully
    const fdaResults = fdaLabelData.results || [];
    if (!fdaResults.length) return null;
    
    // Check if openfda data is available
    const openfda = fdaResults[0]?.openfda;
    if (!openfda) return null;
    
    // Extract RxCUI from openfda section
    const rxcuis = openfda.rxcui;
    if (rxcuis && Array.isArray(rxcuis) && rxcuis.length > 0) {
      const rxcui = rxcuis[0];
      console.log(`[RxNorm Fallback] Extracted RxCUI from FDA label response: ${rxcui}`);
      return rxcui;
    }
    
    return null;
  } catch (error) {
    console.error('[RxNorm Fallback] Error extracting RxCUI from FDA label:', error);
    return null;
  }
}

/**
 * Extract CUI from SUPP.AI response for supplements
 * @param suppaiData SUPP.AI API response data
 */
export function extractCUIFromSuppAI(suppaiData: any): string | null {
  if (!suppaiData || !Array.isArray(suppaiData)) return null;
  
  try {
    // Find the first result with a CUI
    const firstResult = suppaiData.find(item => item?.cui);
    if (firstResult?.cui) {
      console.log(`[RxNorm Fallback] Using CUI from SUPP.AI for supplement: ${firstResult.cui}`);
      return firstResult.cui;
    }
    
    return null;
  } catch (error) {
    console.error('[RxNorm Fallback] Error extracting CUI from SUPP.AI:', error);
    return null;
  }
}
