
/**
 * Utility functions for analyzing text content
 */

/**
 * Detects if text contains primarily mild language about interactions
 * @param text The text to analyze
 * @returns boolean indicating if the text contains primarily mild language
 */
export function containsMildLanguage(text: string): boolean {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  
  // Phrases that indicate mild effects
  const mildPhrases = [
    "generally safe",
    "generally considered safe",
    "monitor for",
    "mild",
    "slight",
    "slightly",
    "minor",
    "minimal",
    "modest",
    "low risk",
    "low-risk",
    "watch for",
    "may cause",
    "might cause",
    "could cause",
    "can sometimes",
    "rarely",
    "unlikely",
    "not usually",
    "consider monitoring",
    "be aware of",
    "caution advised",
    "caution recommended"
  ];
  
  // Phrases that indicate severe effects - if these are present, it's not mild
  const severePhrases = [
    "contraindicated",
    "avoid completely",
    "do not take",
    "never combine",
    "serious risk",
    "dangerous",
    "life-threatening",
    "severe",
    "significant risk",
    "high risk",
    "high-risk",
    "extreme caution",
    "emergency",
    "fatal",
    "hospitalization",
    "death",
    "lethal"
  ];
  
  // Check for severe phrases first - presence of any severe phrase overrides mild language
  for (const phrase of severePhrases) {
    if (lowerText.includes(phrase)) {
      return false; // Not mild if it contains severe language
    }
  }
  
  // Check for mild phrases
  let mildPhraseCount = 0;
  for (const phrase of mildPhrases) {
    if (lowerText.includes(phrase)) {
      mildPhraseCount++;
    }
  }
  
  // Text is considered mild if it contains at least one mild phrase and no severe phrases
  return mildPhraseCount > 0;
}
