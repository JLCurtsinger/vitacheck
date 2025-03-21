
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
  "zoloft": "sertraline",
  "prozac": "fluoxetine",
  "lisinipril": "lisinopril",
  "amoxacillin": "amoxicillin",
  "metformin": "metformin",
  "lipitor": "atorvastatin",
  "vitamine": "vitamin",
  "tumeric": "turmeric",
  "echinacia": "echinacea",
  "gingseng": "ginseng"
};

/**
 * Performs basic spell checking on medication names
 */
export function spellcheckMedication(medicationName: string): string {
  if (!medicationName) return "";
  
  const lowerName = medicationName.toLowerCase();
  
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
 * 3. Normalize capitalization
 */
export function prepareMedicationNameForApi(medicationName: string): string {
  if (!medicationName) return "";
  
  const strippedName = stripMedicationDetails(medicationName);
  const spellcheckedName = spellcheckMedication(strippedName);
  const normalizedName = normalizeMedicationName(spellcheckedName);
  
  console.log(`Formatted medication: "${medicationName}" → "${normalizedName}"`);
  return normalizedName;
}
