
/**
 * RxNorm Fallback System
 * 
 * This module provides fallback mechanisms for retrieving RxCUIs when
 * the primary RxNorm API call fails.
 */

import { prepareMedicationNameForApi } from "@/utils/medication-formatter";
import { getGenericName, isBrandName } from "@/services/medication/brand-to-generic";

// Local cache of known generic drug → RxCUI mappings
const knownRxCUI: Record<string, string> = {
  // Common generic medications
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
  "citalopram": "2556",
  "atenolol": "1202",
  "furosemide": "4603",
  "tramadol": "10689",
  "escitalopram": "352741",
  "clopidogrel": "32968",
  "montelukast": "88249",
  "pantoprazole": "40790",
  "prednisone": "8638",
  "duloxetine": "72625",
  "venlafaxine": "39786",
  "rosuvastatin": "301542",
  "meloxicam": "32696",
  "bupropion": "42347",
  // Common supplements and herbs
  "melatonin": "6711",
  "turmeric": "45262",
  "ginseng": "4553",
  "echinacea": "4444",
  "st. john's wort": "36126",
  "ginkgo biloba": "4468",
  "vitamin d": "5282",
  "vitamin c": "5250",
  "vitamin e": "5253",
  "fish oil": "17573",
  "calcium": "1963",
  "magnesium": "6700",
  "zinc": "11352",
};

/**
 * Get RxCUI from local cache
 * @param medication Medication name to look up
 */
export function getRxCUIFromLocalCache(medication: string): string | null {
  if (!medication) return null;
  
  const normalizedName = medication.toLowerCase().trim();
  console.log(`[RxNorm Fallback] Attempting known generic → RxCUI lookup for "${normalizedName}"`);
  
  if (knownRxCUI[normalizedName]) {
    console.log(`[RxNorm Fallback] Using RxCUI from local cache: ${medication} → ${knownRxCUI[normalizedName]}`);
    return knownRxCUI[normalizedName];
  }
  
  return null;
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
