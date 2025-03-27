
import { InteractionSource, StandardizedApiResponse } from '../../types';
import { logSourceSeverityIssues } from '../debug-logger';
import { validateStandardizedResponse, standardizedResponseToSource } from '../api-response-standardizer';
import { logFullApiResponse, logParsingIssue } from '../diagnostics/api-response-logger';
import { applySourceValidationFallback } from '../consensus-system/source-validation';

/**
 * Processes and adds SUPP.AI interaction sources to the sources array
 * Enhanced with detailed logging and fallback mechanisms
 */
export function processSuppAiSources(
  suppaiResult: StandardizedApiResponse | null,
  suppaiRawResult: any | null,
  sources: InteractionSource[]
): void {
  if (!suppaiResult || !suppaiRawResult) {
    console.log('[SUPP.AI] No results to process');
    return;
  }

  // Log the full raw results for debugging
  logFullApiResponse('SUPP.AI', suppaiRawResult, 'pre-processing');
  
  try {
    // Add detailed validation for SUPP.AI response structure
    if (!suppaiRawResult.sources || !Array.isArray(suppaiRawResult.sources)) {
      logParsingIssue('SUPP.AI', suppaiRawResult, 'Missing or invalid sources array');
      
      // Try to recover if we have interactions in a different format
      if (suppaiRawResult.interactions && Array.isArray(suppaiRawResult.interactions)) {
        console.log('[SUPP.AI] Attempting to recover from interactions array');
        
        for (const interaction of suppaiRawResult.interactions) {
          if (interaction.evidence && interaction.drug1 && interaction.drug2) {
            // Create a synthetic source from SUPP.AI native format
            const syntheticSource: InteractionSource = {
              name: "SUPP.AI",
              severity: determineSupplAiSeverity(interaction),
              description: `Interaction between ${interaction.drug1} and ${interaction.drug2}: ${interaction.evidence}`,
              confidence: interaction.evidence_count ? Math.min(90, 50 + interaction.evidence_count * 5) : 70
            };
            
            // Add debug log for the synthetic source
            logSourceSeverityIssues(syntheticSource, 'Recovered from SUPP.AI interactions array');
            sources.push(syntheticSource);
          }
        }
      }
      
      return;
    }

    suppaiRawResult.sources?.forEach((source: InteractionSource) => {
      // Filter to only include sources with actual evidence
      const hasEvidence = source.description && 
                         (source.description.toLowerCase().includes('evidence') ||
                          source.description.toLowerCase().includes('study') ||
                          source.description.toLowerCase().includes('reported'));
      
      if (hasEvidence || source.severity !== 'unknown') {
        // Add debug log before pushing
        logSourceSeverityIssues(source, 'Before push - SUPP.AI');
        
        // Validate and standardize the source before pushing
        const standardizedResponse = validateStandardizedResponse({
          ...source,
          source: "SUPP.AI"
        });
        
        // Convert standardized response to InteractionSource and push
        const validatedSource = standardizedResponseToSource(standardizedResponse);
        
        // Try fallback logic if the source doesn't pass validation
        if (!validatedSource) {
          const fallbackSource = applySourceValidationFallback(source, suppaiRawResult);
          if (fallbackSource) {
            sources.push(fallbackSource);
            console.log('[SUPP.AI] Added fallback source after standard validation failed');
          }
          return;
        }
        
        sources.push(validatedSource);
      }
    });
    
    // Log if no sources were added after processing
    if (suppaiRawResult.sources.length > 0 && 
        !sources.some(s => s.name === 'SUPP.AI')) {
      logParsingIssue(
        'SUPP.AI', 
        suppaiRawResult, 
        'No valid sources found despite raw data being present'
      );
    }
  } catch (error) {
    logParsingIssue('SUPP.AI', suppaiRawResult, error instanceof Error ? error : String(error));
  }
}

/**
 * Helper function to determine severity from SUPP.AI raw data
 */
function determineSupplAiSeverity(interaction: any): "safe" | "minor" | "moderate" | "severe" | "unknown" {
  if (!interaction) return "unknown";
  
  // Check for explicit severity field
  if (interaction.severity) {
    const severity = interaction.severity.toLowerCase();
    if (severity === 'severe' || severity === 'major') return 'severe';
    if (severity === 'moderate') return 'moderate';
    if (severity === 'minor') return 'minor';
    if (severity === 'safe' || severity === 'none') return 'safe';
  }
  
  // Use evidence count as a proxy for severity if available
  if (interaction.evidence_count) {
    if (interaction.evidence_count >= 5) return 'moderate';
    if (interaction.evidence_count >= 2) return 'minor';
  }
  
  // Check for keywords in evidence text
  if (interaction.evidence) {
    const text = interaction.evidence.toLowerCase();
    if (text.includes('severe') || text.includes('danger') || text.includes('fatal')) {
      return 'severe';
    }
    if (text.includes('moderate') || text.includes('significant')) {
      return 'moderate';
    }
    if (text.includes('mild') || text.includes('minor')) {
      return 'minor';
    }
  }
  
  return "unknown";
}
