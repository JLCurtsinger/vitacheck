
/**
 * SUPP.AI Processor
 * 
 * This file now serves as a proxy to the refactored SUPP.AI processor module.
 * All implementation details have been moved to a dedicated directory.
 */

import { InteractionSource, StandardizedApiResponse } from '../../types';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { logSourceSeverityIssues } from '../debug-logger';

/**
 * Processes and adds SUPP.AI interaction sources
 * 
 * @param suppaiResult Standardized SUPP.AI result
 * @param suppaiRawResult Raw SUPP.AI API response
 * @param sources Array to add processed sources to
 */
export function processSuppAiSources(
  suppaiResult: StandardizedApiResponse | null,
  suppaiRawResult: any,
  sources: InteractionSource[]
): void {
  if (!suppaiResult || !suppaiRawResult) return;
  
  // Process SUPP.AI interactions
  if (suppaiRawResult.interactions && Array.isArray(suppaiRawResult.interactions)) {
    for (const interaction of suppaiRawResult.interactions) {
      if (!interaction) continue;
      
      // Extract data from the SUPP.AI interaction
      const evidences = interaction.evidences || [];
      const supplementInfo = interaction.supplement || {};
      const drugInfo = interaction.drug || {};
      
      // Only process if we have evidences
      if (evidences.length === 0) continue;
      
      // Determine the most likely severity based on SUPP.AI data
      const severity = determineSuppAiSeverity(evidences, interaction);
      
      // Generate a descriptive summary from the evidence
      const description = generateSuppAiDescription(evidences, supplementInfo, drugInfo);
      
      // Create a standardized source
      const source: InteractionSource = {
        name: "SUPP.AI",
        severity,
        description,
        confidence: 0.7, // SUPP.AI has relatively good data quality
        evidences: evidences.map((e: any) => ({
          text: e.text,
          sentence: e.sentence,
          type: e.type,
          confidence: e.score,
          source: e.source,
          url: e.url
        }))
      };
      
      // Add debug log before pushing
      logSourceSeverityIssues(source, 'Before push - SUPP.AI');
      
      // Validate and standardize the source before pushing
      const standardizedResponse = validateStandardizedResponse({
        sources: [source], // Using 'sources' array property instead of 'source'
        severity: source.severity,
        description: source.description,
        confidence: source.confidence,
        rawData: interaction,
        processed: false
      });
      
      // Convert standardized response to InteractionSource and push
      const validatedSource = standardizedResponseToSource(standardizedResponse);
      sources.push(validatedSource);
    }
  }
}

/**
 * Determines severity from SUPP.AI response
 */
function determineSuppAiSeverity(
  evidences: Array<any>,
  interaction: any
): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  // If no evidences, default to unknown
  if (!evidences || evidences.length === 0) return "unknown";
  
  // Extract effect types
  const effectTypes = evidences.map((e: any) => e.type || '').filter(Boolean);
  
  // Count occurrences of different effect types
  const negativeCount = effectTypes.filter((t: string) => t === 'NEGATIVE').length;
  const positiveCount = effectTypes.filter((t: string) => t === 'POSITIVE').length;
  
  // Determine severity based on relative counts of positive/negative effects
  if (negativeCount > positiveCount * 2) {
    // Many more negative effects than positive
    return "moderate";
  } else if (negativeCount > 0) {
    // Some negative effects
    return "minor";
  } else if (positiveCount > 0) {
    // Only positive effects
    return "safe";
  }
  
  // Default if unable to determine
  return "unknown";
}

/**
 * Generates a descriptive summary from SUPP.AI evidence
 */
function generateSuppAiDescription(
  evidences: Array<any>,
  supplementInfo: any,
  drugInfo: any
): string {
  // Default description if no data
  if (!evidences || evidences.length === 0) {
    return "No detailed interaction data available from SUPP.AI.";
  }
  
  // Extract supplement and drug names
  const supplementName = supplementInfo.name || "this supplement";
  const drugName = drugInfo.name || "this medication";
  
  // Find the most relevant evidence (highest score)
  const bestEvidence = [...evidences].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  
  // Generate description based on available data
  if (bestEvidence) {
    // Clean up the evidence text
    let evidenceText = bestEvidence.sentence || bestEvidence.text || "";
    evidenceText = evidenceText.trim().replace(/\s+/g, ' ');
    
    // Add period if missing
    if (!evidenceText.endsWith('.') && !evidenceText.endsWith('!') && !evidenceText.endsWith('?')) {
      evidenceText += '.';
    }
    
    return `SUPP.AI reports a potential interaction between ${supplementName} and ${drugName}. ${evidenceText} Based on analysis of scientific literature and research papers.`;
  }
  
  // Fallback description
  return `SUPP.AI reports a potential interaction between ${supplementName} and ${drugName} based on scientific literature.`;
}
