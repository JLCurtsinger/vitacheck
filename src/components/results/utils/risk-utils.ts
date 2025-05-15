
import { RiskAssessmentOutput } from "@/lib/utils/risk-assessment/types";
import { InteractionResult } from "@/lib/api-utils";
import { analyzeInteractionRisk } from "@/lib/utils/risk-assessment";

/**
 * Analyzes an interaction to determine its risk assessment
 */
export function getRiskAssessment(interaction: InteractionResult): RiskAssessmentOutput | null {
  // Simple risk assessment based on severity if we don't have the detailed assessment
  if (!interaction) return null;
  
  // Return a basic risk assessment based on the interaction severity
  const severity = interaction.severity;
  
  // Check if there are high-confidence sources reporting severe
  const hasHighConfidenceSource = interaction.sources?.some(source => {
    const sourceName = typeof source === 'string' ? source : source.name;
    return sourceName === "FDA" || sourceName === "RxNorm" || sourceName === "OpenFDA Adverse Events";
  });
  
  // Check if only AI is reporting severe
  const onlyAiReportsSevere = 
    severity === "severe" && 
    interaction.sources?.filter(s => {
      if (typeof s === 'string') return false;
      return s.severity === "severe";
    }).every(s => {
      if (typeof s === 'string') return false;
      return s.name === "AI Literature Analysis";
    });
  
  // Apply RULE 1: Restrict severe classification if only AI reports it
  const adjustedSeverity = (severity === "severe" && onlyAiReportsSevere && !hasHighConfidenceSource)
    ? "moderate"
    : severity;
  
  const baseRisk: RiskAssessmentOutput = {
    riskScore: adjustedSeverity === "severe" ? 80 : 
               adjustedSeverity === "moderate" ? 50 : 
               adjustedSeverity === "minor" ? 30 : 
               adjustedSeverity === "unknown" ? 20 : 10,
    severityFlag: adjustedSeverity === "severe" ? '🔴' : 
                  adjustedSeverity === "moderate" || adjustedSeverity === "minor" ? '🟡' : '🟢',
    riskLevel: adjustedSeverity === "severe" ? 'High' : 
              adjustedSeverity === "moderate" ? 'Moderate' : 'Low',
    adjustments: [],
    avoidanceStrategy: 'Consult a healthcare professional for guidance.',
    inputData: {
      severity: adjustedSeverity === "severe" ? "severe" : 
                adjustedSeverity === "moderate" ? "moderate" : "mild"
    },
    contributingFactors: [],
    aiOnlySevere: onlyAiReportsSevere || false
  };
  
  return baseRisk;
}

/**
 * Gets a detailed risk assessment for an interaction
 */
export async function getInteractionRisk(interaction: InteractionResult): Promise<RiskAssessmentOutput> {
  try {
    // Analyze the interaction risk using the ML-enhanced system
    const riskAssessment = await analyzeInteractionRisk(interaction as any);
    return riskAssessment;
  } catch (error) {
    console.error("Error analyzing interaction risk:", error);
    // Return a default risk assessment if analysis fails
    return {
      riskScore: 0,
      severityFlag: '🟢',
      riskLevel: 'Low',
      adjustments: [],
      avoidanceStrategy: 'Unable to analyze risk. Please consult a healthcare professional.',
      inputData: {
        severity: 'mild'
      },
      contributingFactors: [],
      aiOnlySevere: false
    };
  }
}

/**
 * Combines multiple interaction risk assessments into a single overall assessment
 */
export function getCombinedRiskAssessment(
  medications: string[] | undefined, 
  interactions: InteractionResult[]
): RiskAssessmentOutput | null {
  if (!medications || medications.length < 2 || !interactions.length) return null;
  
  // Get the highest risk score and level from all interactions
  let highestRiskScore = 0;
  let highestRiskLevel: 'Low' | 'Moderate' | 'High' | 'Lethal' = 'Low';
  let severestFlag: '🟢' | '🟡' | '🔴' = '🟢';
  
  // Count interactions by severity to determine overall risk
  let severeCount = 0;
  let moderateCount = 0;
  let minorCount = 0;
  
  // Count high-confidence sources that report severe interactions
  let highConfidenceSevereCount = 0;
  
  // Process all interactions to determine the combined risk
  interactions.forEach(interaction => {
    // Count by severity
    if (interaction.severity === "severe") {
      severeCount++;
      
      // Check if any high-confidence source reports severe
      const hasHighConfidenceSource = interaction.sources?.some(source => {
        if (typeof source === 'string') return false;
        return (source.severity === "severe") && 
          (source.name === "FDA" || source.name === "RxNorm" || source.name === "OpenFDA Adverse Events");
      });
      
      if (hasHighConfidenceSource) {
        highConfidenceSevereCount++;
      }
    }
    
    if (interaction.severity === "moderate") moderateCount++;
    if (interaction.severity === "minor") minorCount++;
    
    // Get base risk assessment for this interaction
    const risk = getRiskAssessment(interaction);
    if (!risk) return;
    
    // Update highest risk score and level
    if (risk.riskScore > highestRiskScore) {
      highestRiskScore = risk.riskScore;
      highestRiskLevel = risk.riskLevel;
    }
    
    // Update severest flag
    if (risk.severityFlag === '🔴') {
      severestFlag = '🔴';
    } else if (risk.severityFlag === '🟡' && severestFlag !== '🔴') {
      severestFlag = '🟡';
    }
  });
  
  // RULE 1: If no high-confidence source reports severe, cap at moderate
  const aiOnlySevere = severeCount > 0 && highConfidenceSevereCount === 0;
  
  // Calculate an aggregate risk score based on counts
  const totalInteractions = interactions.length;
  
  // If only AI sources report severe, cap the weighting for severe counts
  const effectiveSevereCount = aiOnlySevere ? Math.min(severeCount, 1) * 0.5 : severeCount;
  
  const weightedScore = Math.min(
    100,
    (effectiveSevereCount * 40 + moderateCount * 20 + minorCount * 10) / 
    Math.max(1, totalInteractions) * 2.5
  );
  
  // Use the higher of highest individual risk or weighted score
  // But cap if only AI reports severe
  let finalRiskScore = Math.max(highestRiskScore, weightedScore);
  
  if (aiOnlySevere) {
    finalRiskScore = Math.min(finalRiskScore, 69); // Cap just below high risk threshold
    severestFlag = '🟡'; // Downgrade to yellow
  }
  
  // Determine final risk level based on the final score
  const finalRiskLevel = 
    finalRiskScore >= 75 ? 'High' :
    finalRiskScore >= 40 ? 'Moderate' : 'Low';
  
  // Create adjustment descriptions based on counts
  const adjustments = [];
  
  if (severeCount > 0) {
    if (highConfidenceSevereCount > 0) {
      adjustments.push({
        sources: ['High-Confidence Data Sources'],
        description: `${highConfidenceSevereCount} high-confidence severe interaction${highConfidenceSevereCount > 1 ? 's' : ''} found`
      });
    } else {
      adjustments.push({
        sources: ['Limited Confidence Sources'],
        description: `${severeCount} potential severe interaction${severeCount > 1 ? 's' : ''} with limited verification`
      });
    }
  }
  
  if (moderateCount > 0) {
    adjustments.push({
      sources: ['Moderate Interactions'],
      description: `${moderateCount} moderate interaction${moderateCount > 1 ? 's' : ''} found`
    });
  }
  
  // Generate an avoidance strategy based on risk level
  let avoidanceStrategy = '';
  
  if (finalRiskLevel === 'High') {
    avoidanceStrategy = 'High risk combination detected. Consult with a healthcare provider before taking these medications together.';
  } else if (finalRiskLevel === 'Moderate') {
    avoidanceStrategy = 'Moderate risk combination. Monitor for side effects and consider consulting a healthcare provider.';
  } else {
    avoidanceStrategy = 'Low risk combination. As with any medication, monitor for unexpected side effects.';
  }
  
  return {
    riskScore: Math.round(finalRiskScore),
    severityFlag: severestFlag,
    riskLevel: finalRiskLevel as 'Low' | 'Moderate' | 'High' | 'Lethal',
    adjustments: adjustments,
    avoidanceStrategy: avoidanceStrategy,
    inputData: {
      severity: highConfidenceSevereCount > 0 ? 'severe' : 
                aiOnlySevere ? 'moderate' : 
                moderateCount > 0 ? 'moderate' : 'mild'
    },
    contributingFactors: [
      ...(severeCount > 0 ? ['Severe interaction warnings'] : []),
      ...(moderateCount > 0 ? ['Moderate interaction warnings'] : []),
      ...(minorCount > 0 ? ['Minor interaction notes'] : [])
    ],
    aiOnlySevere
  };
}
