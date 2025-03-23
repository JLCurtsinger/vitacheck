
import { InteractionResult } from '../types';

/**
 * Extracts a concise warning from a longer description
 */
export function extractMainWarning(description: string, medications: string[]): string {
  if (!description) return "";
  
  // Try to get the first sentence
  const sentences = description.split(/[.!?][\s\n]/);
  let warning = sentences[0];
  
  // If it's too long, truncate it
  if (warning.length > 120) {
    warning = warning.substring(0, 120) + "...";
  }
  
  // Add medication names for context if they're not already mentioned
  if (medications.length === 2) {
    const medsPattern = new RegExp(medications.join('|'), 'i');
    if (!medsPattern.test(warning)) {
      warning = `When taking ${medications.join(' with ')}: ${warning}`;
    }
  }
  
  return warning;
}

/**
 * Extracts key warnings from all interactions
 */
export function extractCombinedWarnings(interactions: InteractionResult[]): string[] {
  // Sort interactions by medication names for deterministic processing
  const sortedInteractions = [...interactions].sort((a, b) => {
    const nameA = a.medications.join('+');
    const nameB = b.medications.join('+');
    return nameA.localeCompare(nameB);
  });
  
  // Extract key warnings from all interactions
  const allWarnings: string[] = [];
  sortedInteractions.forEach(interaction => {
    if (interaction.severity === "severe" || interaction.severity === "moderate") {
      // Extract warning from description
      const mainWarning = extractMainWarning(interaction.description, interaction.medications);
      if (mainWarning && !allWarnings.includes(mainWarning)) {
        allWarnings.push(mainWarning);
      }
    }
  });
  
  // Sort warnings alphabetically for consistency
  return allWarnings.sort();
}
