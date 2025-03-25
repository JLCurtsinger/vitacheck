
/**
 * Risk Assessment Utility
 * 
 * This module provides functions for calculating standardized risk scores
 * based on data from multiple sources.
 */

type Source = {
  signal?: boolean;
  plausible?: boolean;
  score: number;
  weight: number;
};

type Sources = Record<string, Source>;

type Severity = 'mild' | 'moderate' | 'severe';

interface RiskAssessmentInput {
  severity: Severity;
  sources: Sources;
}

interface RiskAssessmentOutput {
  riskScore: number;
  confidence: number;
  severityFlag: '🔴' | '🟡' | '🟢';
}

/**
 * Calculate a standardized risk score based on multiple data sources
 * 
 * @param input Object containing severity level and data sources
 * @returns Standardized risk assessment with risk score, confidence and severity flag
 */
export function calculateRiskScore(input: RiskAssessmentInput): RiskAssessmentOutput {
  const { severity, sources } = input;
  
  // Define severity multipliers
  const severityMultipliers: Record<Severity, number> = {
    'mild': 1,
    'moderate': 1.25,
    'severe': 1.5
  };
  
  const severityMultiplier = severityMultipliers[severity] || 1;
  
  // Filter for active sources (those with signal or plausible = true)
  const activeSources = Object.entries(sources).filter(([_, source]) => 
    source.signal === true || source.plausible === true
  );
  
  // Calculate weighted risk score
  let rawRiskScore = 0;
  activeSources.forEach(([_, source]) => {
    rawRiskScore += source.weight * source.score * severityMultiplier;
  });
  
  // Normalize score to max of 100
  const riskScore = Math.min(Math.round(rawRiskScore), 100);
  
  // Calculate confidence score
  // Start at 50, add 10 for each active source, cap at 100
  const confidence = Math.min(50 + (activeSources.length * 10), 100);
  
  // Determine severity flag based on risk score
  let severityFlag: '🔴' | '🟡' | '🟢';
  if (riskScore >= 70) {
    severityFlag = '🔴';
  } else if (riskScore >= 40) {
    severityFlag = '🟡';
  } else {
    severityFlag = '🟢';
  }
  
  return {
    riskScore,
    confidence,
    severityFlag
  };
}

// Define types for the raw input data structure
interface RawSourceData {
  signal?: boolean;
  plausible?: boolean;
  count?: number;
  [key: string]: any; // Allow for additional properties in raw data
}

interface RawRiskData {
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

// Define the enhanced output that includes original input summary
export interface EnhancedRiskAssessmentOutput extends RiskAssessmentOutput {
  inputSummary: {
    severity: Severity;
    sources: Sources;
  };
}

// Define constants for source weights and scores
const SOURCE_WEIGHTS = {
  fdaReports: 0.35,
  openFDA: 0.35,
  suppAI: 0.15,
  mechanism: 0.3,
  aiLiterature: 0.25,
  peerReports: 0.05,
  rxnorm: 0.2
};

// Default scores for active sources when count isn't provided
const DEFAULT_SCORES = {
  fdaReports: 70,
  openFDA: 70,
  suppAI: 50,
  mechanism: 60,
  aiLiterature: 55,
  peerReports: 40,
  rxnorm: 65
};

/**
 * Prepares raw API response data for risk assessment calculation
 * 
 * @param inputData Object containing raw data from various API sources
 * @returns Enhanced risk assessment output with original input summary
 */
export function prepareRiskAssessment(inputData: RawRiskData): EnhancedRiskAssessmentOutput {
  const { severity } = inputData;
  const sources: Sources = {};
  
  // Process each potential source in the input data
  Object.entries(inputData).forEach(([key, value]) => {
    // Skip the severity field and any undefined sources
    if (key === 'severity' || !value) return;
    
    const source = value as RawSourceData;
    
    // Only include sources with defined signal or plausible flags
    if (source.signal !== undefined || source.plausible !== undefined) {
      // Calculate score based on count if available, otherwise use default
      let score = DEFAULT_SCORES[key as keyof typeof DEFAULT_SCORES] || 50;
      
      // Adjust score if count is provided (higher count = higher score)
      if (source.count !== undefined) {
        // Simple formula: base 40 + scaled value based on count (max 100)
        score = 40 + Math.min(Math.round(source.count / 2), 60);
      }
      
      // Get weight from constants or default to 0.2
      const weight = SOURCE_WEIGHTS[key as keyof typeof SOURCE_WEIGHTS] || 0.2;
      
      // Add the formatted source to our sources object
      sources[key] = {
        signal: source.signal,
        plausible: source.plausible,
        score,
        weight
      };
    }
  });
  
  // Prepare input for risk calculation
  const riskInput: RiskAssessmentInput = {
    severity,
    sources
  };
  
  // Calculate risk score
  const riskOutput = calculateRiskScore(riskInput);
  
  // Return enhanced output with input summary
  return {
    ...riskOutput,
    inputSummary: {
      severity,
      sources
    }
  };
}

/**
 * Example usage:
 * 
 * const rawData = {
 *   fdaReports: { signal: true, count: 87 },
 *   suppAI: { signal: false },
 *   mechanism: { plausible: true },
 *   peerReports: { signal: false },
 *   severity: 'severe' as const
 * };
 * 
 * const assessment = prepareRiskAssessment(rawData);
 * 
 * // Result would contain:
 * // {
 * //   riskScore: (calculated value 0-100),
 * //   confidence: (calculated value 0-100),
 * //   severityFlag: '🔴', '🟡', or '🟢',
 * //   inputSummary: {
 * //     severity: 'severe',
 * //     sources: {
 * //       fdaReports: { signal: true, score: 83, weight: 0.35 },
 * //       suppAI: { signal: false, score: 50, weight: 0.15 },
 * //       mechanism: { plausible: true, score: 60, weight: 0.3 },
 * //       peerReports: { signal: false, score: 40, weight: 0.05 }
 * //     }
 * //   }
 * // }
 */
