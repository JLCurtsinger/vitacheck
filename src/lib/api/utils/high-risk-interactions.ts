
/**
 * High-Risk Medication Combinations Module
 * 
 * This module maintains a database of known high-risk medication combinations
 * and provides utilities for checking if a given combination is dangerous.
 * This serves as an immediate safety check before querying external APIs.
 * 
 * @module high-risk-interactions
 */

/**
 * Represents a known high-risk medication combination
 */
interface HighRiskCombination {
  /** Array of medication names or active ingredients that are part of this combination */
  meds: string[];
  /** The medication or substance this combination interacts dangerously with */
  interactsWith: string;
  /** The severity level of the interaction */
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  /** Detailed description of the interaction and its risks */
  description: string;
}

/**
 * Database of known high-risk medication combinations
 * This list is maintained based on well-documented dangerous interactions
 * and should be regularly updated with new medical findings
 */
const HIGH_RISK_COMBINATIONS: HighRiskCombination[] = [
  {
    meds: ["xanax", "alprazolam", "benzodiazepine"],
    interactsWith: "alcohol",
    severity: "severe",
    description: "DANGER: Can cause dangerous sedation and respiratory depression. DO NOT combine."
  },
  {
    meds: ["lithium"],
    interactsWith: "ibuprofen",
    severity: "moderate",
    description: "WARNING: May increase lithium levels, potentially causing side effects. Monitor closely."
  },
  {
    meds: ["xanax", "alprazolam"],
    interactsWith: "ibuprofen",
    severity: "minor",
    description: "May slightly increase sedative effects. Generally safe but monitor for increased drowsiness."
  }
];

/**
 * Checks if a pair of medications represents a known high-risk combination
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @returns Object indicating if the combination is high-risk and relevant details
 */
export function checkHighRiskCombination(med1: string, med2: string): {
  isHighRisk: boolean;
  severity?: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description?: string;
} {
  const med1Lower = med1.toLowerCase();
  const med2Lower = med2.toLowerCase();

  for (const combo of HIGH_RISK_COMBINATIONS) {
    if (
      (combo.meds.includes(med1Lower) && med2Lower === combo.interactsWith) ||
      (combo.meds.includes(med2Lower) && med1Lower === combo.interactsWith)
    ) {
      return {
        isHighRisk: true,
        severity: combo.severity,
        description: combo.description
      };
    }
  }

  return { isHighRisk: false };
}
