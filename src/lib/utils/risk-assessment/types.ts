
/**
 * Input data for risk assessment
 */
export interface RiskAssessmentInput {
  // Core severity from primary data
  severity: "severe" | "moderate" | "mild";
  
  // FDA data points
  fdaReports?: {
    signal: boolean;
    count?: number;
  };
  
  // OpenFDA adverse events
  openFDA?: {
    signal: boolean;
    count?: number;
    percentage?: number;
  };
  
  // SUPP.AI analysis
  suppAI?: {
    signal: boolean;
  };
  
  // Biological mechanism
  mechanism?: {
    plausible: boolean;
  };
  
  // AI Literature analysis
  aiLiterature?: {
    plausible: boolean;
  };
  
  // Peer-reported interactions
  peerReports?: {
    signal: boolean;
  };
}

/**
 * Output from the risk assessment
 */
export interface RiskAssessmentOutput {
  // Calculated risk score (0-100)
  riskScore: number;
  
  // Visual indicator of severity (🔴, 🟡, 🟢)
  severityFlag: '🔴' | '🟡' | '🟢';
  
  // Factors that influenced the score
  adjustments: string[];
  
  // Recommended avoidance strategy if available
  avoidanceStrategy: string;
  
  // Original input data for reference
  inputData: RiskAssessmentInput;
}
