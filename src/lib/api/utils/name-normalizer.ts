
/**
 * Utility functions for normalizing medication names
 * to ensure consistency in the database
 */

/**
 * Normalizes a medication name for database storage
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes content in parentheses
 * - Removes special characters
 * 
 * @param name Medication or supplement name
 * @returns Normalized name
 */
export function normalizeMedicationName(name: string): string {
  if (!name) return '';
  
  // Convert to lowercase and trim
  let normalized = name.toLowerCase().trim();
  
  // Remove content inside parentheses including the parentheses
  normalized = normalized.replace(/\s*\([^)]*\)/g, '');
  
  // Remove special characters (commas, periods, etc.)
  normalized = normalized.replace(/[,.;:#!?'"]/g, '');
  
  // Replace multiple spaces with a single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  return normalized.trim();
}

/**
 * Generates a consistent key for a medication pair
 * Ensures that the same two medications always produce the same key
 * regardless of the order they are provided
 * 
 * @param med1 First medication name (will be normalized)
 * @param med2 Second medication name (will be normalized)
 * @returns A consistent key for the medication pair
 */
export function generateMedicationPairKey(med1: string, med2: string): string {
  const normalizedMed1 = normalizeMedicationName(med1);
  const normalizedMed2 = normalizeMedicationName(med2);
  
  // Ensure consistent ordering (alphabetical)
  return [normalizedMed1, normalizedMed2].sort().join('_');
}
