interface HighRiskCombination {
  meds: string[];
  interactsWith: string[];
  warning: string;
  description: string;
}

export const HIGH_RISK_COMBINATIONS: HighRiskCombination[] = [
  {
    meds: ["xanax", "alprazolam", "benzodiazepine", "valium", "diazepam", "ativan", "lorazepam", "klonopin", "clonazepam"],
    interactsWith: ["alcohol", "beer", "wine", "liquor"],
    warning: "severe",
    description: "DANGER: Never combine benzodiazepines with alcohol. This combination can cause dangerous sedation, respiratory depression, and potentially fatal complications."
  },
  {
    meds: ["oxycodone", "hydrocodone", "morphine", "fentanyl", "codeine", "tramadol", "vicodin", "percocet"],
    interactsWith: ["alcohol", "beer", "wine", "liquor"],
    warning: "severe",
    description: "DANGER: Never combine opioids with alcohol. This combination can cause life-threatening respiratory depression and overdose."
  }
];

export function checkHighRiskCombination(med1: string, med2: string): { isHighRisk: boolean; warning?: string; description?: string } {
  const med1Lower = med1.toLowerCase();
  const med2Lower = med2.toLowerCase();

  for (const combo of HIGH_RISK_COMBINATIONS) {
    const isFirstMedInHighRiskList = combo.meds.some(m => med1Lower.includes(m));
    const isSecondMedInInteractsList = combo.interactsWith.some(m => med2Lower.includes(m));
    
    const isSecondMedInHighRiskList = combo.meds.some(m => med2Lower.includes(m));
    const isFirstMedInInteractsList = combo.interactsWith.some(m => med1Lower.includes(m));

    if ((isFirstMedInHighRiskList && isSecondMedInInteractsList) || 
        (isSecondMedInHighRiskList && isFirstMedInInteractsList)) {
      return {
        isHighRisk: true,
        warning: combo.warning,
        description: combo.description
      };
    }
  }

  return { isHighRisk: false };
}