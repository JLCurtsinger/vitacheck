
/**
 * Basic formatting for medication names
 */
export function formatMedicationName(name: string): string {
  if (!name) return "";
  
  // Remove text in parentheses
  const withoutParentheses = name.replace(/\s*\([^)]*\)/g, "").trim();
  
  // Proper case (first letter uppercase, rest lowercase)
  return withoutParentheses.charAt(0).toUpperCase() + withoutParentheses.slice(1).toLowerCase();
}
