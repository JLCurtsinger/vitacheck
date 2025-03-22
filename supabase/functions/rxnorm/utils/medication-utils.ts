
/**
 * Basic formatting for medication names
 */
export function formatMedicationName(name: string): string {
  if (!name) return "";
  
  // Remove text in parentheses
  const withoutParentheses = name.replace(/\s*\([^)]*\)/g, "").trim();
  
  // Split the string into words
  const words = withoutParentheses.split(/\s+/);
  
  // Process each word - capitalize first letter of each word, except small connecting words
  const smallWords = ["and", "or", "the", "a", "an", "of", "in", "for", "with", "on", "at", "by", "to"];
  
  const properCasedWords = words.map((word, index) => {
    // Always capitalize the first word
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Check if it's a small word
    if (smallWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // Regular word - capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return properCasedWords.join(" ");
}
