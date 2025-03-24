
import { getGenericName, isBrandName } from "@/services/medication/brand-to-generic";

/**
 * Utility functions for formatting medication names
 */

/**
 * Removes dosage form information and other details in parentheses from medication names
 * Example: "XANAX (Oral Pill)" -> "XANAX"
 */
export function stripMedicationDetails(medicationName: string): string {
  if (!medicationName) return "";
  
  // Remove text in parentheses including the parentheses
  return medicationName.replace(/\s*\([^)]*\)/g, "").trim();
}

/**
 * Normalizes capitalization of medication names
 * For multi-word medication names, capitalizes first letter of each word
 */
export function normalizeMedicationName(medicationName: string): string {
  if (!medicationName) return "";
  
  // Capitalize first letter of each word
  return medicationName
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats a medication name for API calls by removing parenthetical content
 * and normalizing capitalization
 */
export function formatMedicationForApi(medicationName: string): string {
  if (!medicationName) return "";
  
  // First strip details, then normalize capitalization
  const strippedName = stripMedicationDetails(medicationName);
  return normalizeMedicationName(strippedName);
}

// Common medication spelling corrections
const COMMON_SPELLINGS: Record<string, string> = {
  "ibuprofren": "ibuprofen",
  "acetaminophen": "acetaminophen",
  "advil": "ibuprofen",
  "tylenol": "acetaminophen",
  "asprin": "aspirin",
  "xannax": "xanax",
  "zanax": "xanax",
  "zoloft": "sertraline",
  "prozac": "fluoxetine",
  "lisinipril": "lisinopril",
  "amoxacillin": "amoxicillin",
  "metformin": "metformin",
  "lipitor": "atorvastatin",
  "vitamine": "vitamin",
  "tumeric": "turmeric",
  "echinacia": "echinacea",
  "gingseng": "ginseng",
  "warfrin": "warfarin",
  "simvistatin": "simvastatin",
  "omeprazol": "omeprazole",
  "nexeum": "nexium",
  "levothyroxin": "levothyroxine",
  "atenalol": "atenolol",
  "metropolol": "metoprolol",
  "escitalopram": "escitalopram",
  "escitalopran": "escitalopram",
  "ciprofloxacin": "ciprofloxacin",
  "hydrochlorothiazid": "hydrochlorothiazide"
};

/**
 * Performs basic spell checking on medication names
 */
export function spellcheckMedication(medicationName: string): string {
  if (!medicationName) return "";
  
  const lowerName = medicationName.toLowerCase().trim();
  
  // Check if this exact name needs correction
  if (COMMON_SPELLINGS[lowerName]) {
    return COMMON_SPELLINGS[lowerName];
  }
  
  // Check each word in multi-word medication names
  const words = lowerName.split(" ");
  const correctedWords = words.map(word => {
    return COMMON_SPELLINGS[word] || word;
  });
  
  return correctedWords.join(" ");
}

/**
 * Complete medication formatting pipeline for API calls:
 * 1. Strip details
 * 2. Spellcheck
 * 3. Convert brand to generic if applicable
 * 4. Normalize capitalization
 */
export function prepareMedicationNameForApi(medicationName: string): string {
  if (!medicationName) return "";
  
  const strippedName = stripMedicationDetails(medicationName);
  const spellcheckedName = spellcheckMedication(strippedName);
  
  // Check if this is a brand name and get its generic equivalent
  const isBrand = isBrandName(spellcheckedName);
  const nameForApi = isBrand ? getGenericName(spellcheckedName) : spellcheckedName;
  
  const normalizedName = normalizeMedicationName(nameForApi);
  
  console.log(`Formatted medication: "${medicationName}" → "${normalizedName}"${isBrand ? ` (brand → generic)` : ''}`);
  return normalizedName;
}

/**
 * Format medication information for display, including both brand and generic names
 */
export function prepareMedicationForDisplay(medicationName: string): {
  displayName: string;
  genericName: string;
  isBrand: boolean;
} {
  if (!medicationName) return { displayName: "", genericName: "", isBrand: false };
  
  const strippedName = stripMedicationDetails(medicationName);
  const spellcheckedName = spellcheckMedication(strippedName);
  const normalizedName = normalizeMedicationName(spellcheckedName);
  
  const isBrand = isBrandName(normalizedName);
  const genericName = isBrand ? getGenericName(normalizedName) : normalizedName;
  
  return {
    displayName: normalizedName,
    genericName: normalizeMedicationName(genericName),
    isBrand
  };
}
