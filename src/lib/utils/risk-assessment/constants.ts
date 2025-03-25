
/**
 * Risk Assessment Constants
 * 
 * Constants used in risk assessment calculations.
 */

// Define constants for source weights
export const SOURCE_WEIGHTS = {
  fdaReports: 0.35,
  openFDA: 0.35,
  suppAI: 0.15,
  mechanism: 0.3,
  aiLiterature: 0.25,
  peerReports: 0.05,
  rxnorm: 0.2
};

// Default scores for active sources when count isn't provided
export const DEFAULT_SCORES = {
  fdaReports: 70,
  openFDA: 70,
  suppAI: 50,
  mechanism: 60,
  aiLiterature: 55,
  peerReports: 40,
  rxnorm: 65
};

// Define severity multipliers
export const SEVERITY_MULTIPLIERS = {
  'mild': 1,
  'moderate': 1.25,
  'severe': 1.5
};
