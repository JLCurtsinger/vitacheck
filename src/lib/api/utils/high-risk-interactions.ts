
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
  /** How confident we are about this interaction (0-100) */
  confidence: number;
  /** Whether this should override API results */
  forceOverride: boolean;
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
    description: "DANGER: Can cause dangerous sedation and respiratory depression. DO NOT combine.",
    confidence: 95,
    forceOverride: true // This is a well-documented dangerous interaction that should always override
  },
  {
    meds: ["lithium"],
    interactsWith: "ibuprofen",
    severity: "moderate",
    description: "WARNING: May increase lithium levels, potentially causing side effects. Monitor closely.",
    confidence: 85,
    forceOverride: false // Allow API results to override if they provide good data
  },
  {
    meds: ["xanax", "alprazolam"],
    interactsWith: "ibuprofen",
    severity: "minor",
    description: "May slightly increase sedative effects. Generally safe but monitor for increased drowsiness.",
    confidence: 75,
    forceOverride: false // Allow API results to override
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
  confidence?: number;
  forceOverride?: boolean;
} {
  const med1Lower = med1.toLowerCase();
  const med2Lower = med2.toLowerCase();

  for (const combo of HIGH_RISK_COMBINATIONS) {
    // Check if either medication matches the combination
    const med1Matches = combo.meds.some(m => med1Lower.includes(m) || m.includes(med1Lower));
    const med2Matches = combo.meds.some(m => med2Lower.includes(m) || m.includes(med2Lower));
    
    const interactsWith1 = med1Lower === combo.interactsWith || med1Lower.includes(combo.interactsWith);
    const interactsWith2 = med2Lower === combo.interactsWith || med2Lower.includes(combo.interactsWith);
    
    // Match if one medication is in the meds array and the other is what it interacts with
    if ((med1Matches && interactsWith2) || (med2Matches && interactsWith1)) {
      console.log(`HIGH-RISK MATCH: ${med1} + ${med2} matches known combination with severity ${combo.severity}`);
      return {
        isHighRisk: true,
        severity: combo.severity,
        description: combo.description,
        confidence: combo.confidence,
        forceOverride: combo.forceOverride
      };
    }
  }

  return { isHighRisk: false };
}
