
/**
 * Risk Assessment Constants
 * 
 * Constants used in risk assessment calculations.
 */

// Weights for different data sources in risk calculation
export const SOURCE_WEIGHTS = {
  fdaReports: 0.35,
  openFDA: 0.35, 
  suppAI: 0.15,
  mechanism: 0.3,
  aiLiterature: 0.25,
  peerReports: 0.05
};

// Default severity threshold values
export const SEVERITY_THRESHOLDS = {
  HIGH_RISK: 70,
  MODERATE_RISK: 40
};

// Severity multiplier values
export const SEVERITY_MULTIPLIERS = {
  severe: 1.5,
  moderate: 1.25,
  mild: 1.0
};
