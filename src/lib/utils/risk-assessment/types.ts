
/**
 * Risk Assessment Types
 * 
 * Type definitions for the risk assessment system.
 */

export type Source = {
  signal?: boolean;
  plausible?: boolean;
  score: number;
  weight: number;
};

export type Sources = Record<string, Source>;

export type Severity = 'mild' | 'moderate' | 'severe';

export interface RiskAssessmentInput {
  severity: Severity;
  sources: Sources;
}

export interface RiskAssessmentOutput {
  riskScore: number;
  confidence: number;
  severityFlag: '🔴' | '🟡' | '🟢';
}

// Define the enhanced output that includes original input summary
export interface EnhancedRiskAssessmentOutput extends RiskAssessmentOutput {
  inputSummary: {
    severity: Severity;
    sources: Sources;
  };
}

// Define types for the raw input data structure
export interface RawSourceData {
  signal?: boolean;
  plausible?: boolean;
  count?: number;
  [key: string]: any; // Allow for additional properties in raw data
}

export interface RawRiskData {
  fdaReports?: RawSourceData;
  suppAI?: RawSourceData;
  mechanism?: RawSourceData;
  peerReports?: RawSourceData;
  openFDA?: RawSourceData;
  aiLiterature?: RawSourceData;
  rxnorm?: RawSourceData;
  [key: string]: RawSourceData | Severity | undefined;
  severity: Severity;
}
