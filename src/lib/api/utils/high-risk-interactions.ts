interface HighRiskCombination {
  meds: string[];
  interactsWith: string;
  severity: "safe" | "minor" | "severe" | "unknown";
  description: string;
}

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
    severity: "severe",
    description: "WARNING: May increase lithium levels, causing toxicity. Avoid combination."
  }
];

export function checkHighRiskCombination(med1: string, med2: string): {
  isHighRisk: boolean;
  severity?: "safe" | "minor" | "severe" | "unknown";
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