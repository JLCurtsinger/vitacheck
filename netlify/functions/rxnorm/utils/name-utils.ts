
/**
 * Normalizes a medication name for consistent database storage and lookup
 * Applies standardization rules to ensure we can find matches regardless of case, whitespace, etc.
 * 
 * @param name Original medication name
 * @returns Normalized name for database use
 */
export function normalizeMedicationName(name: string): string {
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
