
export interface RiskAssessmentInput {
  severity: "severe" | "moderate" | "mild";
  fdaReports?: { 
    signal: boolean; 
    count?: number;
  };
  openFDA?: { 
    signal: boolean;
    count?: number;
    percentage?: number;
  };
  suppAI?: { 
    signal: boolean;
  };
  mechanism?: { 
    plausible: boolean;
  };
  aiLiterature?: { 
    plausible: boolean;
  };
  peerReports?: { 
    signal: boolean;
  };
  rxnorm?: {
    signal: boolean;
  };
}

export interface RiskAdjustment {
  sources: string[];
  description: string;
}

export interface RiskAssessmentOutput {
  riskScore: number;
  severityFlag: '🔴' | '🟡' | '🟢';
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal';
  adjustments: (RiskAdjustment | string)[];
  avoidanceStrategy: string;
  inputData: RiskAssessmentInput;
  modelConfidence?: number;
  mlPrediction?: {
    score: number;
    riskLevel: string;
    confidence: number;
  };
}

export type RiskModelFeatures = [
  number,  // 0: severity (0 = mild, 1 = moderate, 2 = severe)
  number,  // 1: fdaSignal (0/1)
  number,  // 2: fdaCount (normalized)
  number,  // 3: openFdaSignal (0/1)
  number,  // 4: openFdaCount (normalized)
  number,  // 5: openFdaPercentage (normalized)
  number,  // 6: suppaiSignal (0/1)
  number,  // 7: mechanismPlausible (0/1)
  number,  // 8: aiLiterature (0/1)
  number,  // 9: peerReports (0/1)
];
