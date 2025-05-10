
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
  
  // Initial source count for diagnostic logging
  const initialSourceCount = sources.length;
  console.log(`[SUPP.AI] Starting processing with ${initialSourceCount} sources`);
  
  try {
    // Add detailed validation for SUPP.AI response structure
    if (!suppaiRawResult.sources || !Array.isArray(suppaiRawResult.sources)) {
      logParsingIssue('SUPP.AI', suppaiRawResult, 'Missing or invalid sources array');
      
      // Try to recover if we have interactions in a different format
      if (suppaiRawResult.interactions && Array.isArray(suppaiRawResult.interactions)) {
        console.log(`[SUPP.AI] Attempting to recover from interactions array with ${suppaiRawResult.interactions.length} items`);
        
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
            console.log(`[SUPP.AI] Created synthetic source from interaction data: "${syntheticSource.severity}" severity, description length: ${syntheticSource.description.length}, confidence: ${syntheticSource.confidence}%`);
            sources.push(syntheticSource);
          }
        }
        
        console.log(`[SUPP.AI] Recovery attempt added ${sources.length - initialSourceCount} sources`);
      }
      
      return;
    }

    console.log(`[SUPP.AI] Processing ${suppaiRawResult.sources?.length || 0} sources from response`);
    let validSourcesCount = 0;
    let excludedSourcesCount = 0;

    suppaiRawResult.sources?.forEach((source: InteractionSource, index: number) => {
      // Filter to only include sources with actual evidence
      const hasEvidence = source.description && 
                         (source.description.toLowerCase().includes('evidence') ||
                          source.description.toLowerCase().includes('study') ||
                          source.description.toLowerCase().includes('reported'));
      
      console.log(`[SUPP.AI] Examining source #${index}: ${hasEvidence ? 'Has evidence' : 'Lacks evidence'}, severity: "${source.severity}"`);
      
      if (hasEvidence || source.severity !== 'unknown') {
        // Add debug log before pushing
        console.log(`[SUPP.AI] Processing relevant source: "${source.severity}" severity, description length: ${source.description?.length || 0}`);
        
        // Validate and standardize the source before pushing - fixing 'source' to 'sources'
        const standardizedResponse = validateStandardizedResponse({
          sources: [source], // Fix: Fix source field to array with source
          severity: source.severity,
          description: source.description,
          confidence: source.confidence,
          rawData: {},
          processed: false
        });
        
        console.log(`[SUPP.AI] Standardized response: severity="${standardizedResponse.severity}", confidence=${standardizedResponse.confidence}`);
        
        // Convert standardized response to InteractionSource and push
        const validatedSource = standardizedResponseToSource(standardizedResponse);
        
        if (validatedSource) {
          console.log(`[SUPP.AI] Adding validated source: "${validatedSource.severity}" severity, confidence=${validatedSource.confidence}`);
          sources.push(validatedSource);
          validSourcesCount++;
        } else {
          // Try fallback logic if the source doesn't pass validation
          console.log(`[SUPP.AI] Standard validation failed, attempting fallback for source`);
          const fallbackSource = applySourceValidationFallback(source, suppaiRawResult);
          if (fallbackSource) {
            sources.push(fallbackSource);
            console.log('[SUPP.AI] Added fallback source after standard validation failed');
            validSourcesCount++;
          } else {
            excludedSourcesCount++;
            console.log('[SUPP.AI] Fallback validation also failed, source excluded');
          }
        }
      } else {
        excludedSourcesCount++;
        console.log(`[SUPP.AI] Source excluded: ${source.description?.substring(0, 100) || 'No description'}`);
      }
    });
    
    console.log(`[SUPP.AI] Processing summary: ${validSourcesCount} valid sources added, ${excludedSourcesCount} sources excluded`);
    console.log(`[SUPP.AI] Total sources after processing: ${sources.length}`);
    
    // Log if no sources were added after processing
    if (suppaiRawResult.sources?.length > 0 && 
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
  
  // Log input for diagnostic purposes
  console.log(`[SUPP.AI] Determining severity for interaction:`, {
    drugs: interaction.drug1 && interaction.drug2 ? `${interaction.drug1} + ${interaction.drug2}` : 'Unknown',
    hasSeverity: !!interaction.severity,
    severityValue: interaction.severity,
    evidenceCount: interaction.evidence_count,
    hasEvidenceText: !!interaction.evidence
  });
  
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
    if (interaction.evidence_count >= 5) {
      console.log(`[SUPP.AI] Determined "moderate" severity based on evidence count: ${interaction.evidence_count}`);
      return 'moderate';
    }
    if (interaction.evidence_count >= 2) {
      console.log(`[SUPP.AI] Determined "minor" severity based on evidence count: ${interaction.evidence_count}`);
      return 'minor';
    }
  }
  
  // Check for keywords in evidence text
  if (interaction.evidence) {
    const text = interaction.evidence.toLowerCase();
    if (text.includes('severe') || text.includes('danger') || text.includes('fatal')) {
      console.log(`[SUPP.AI] Determined "severe" severity based on evidence text keywords`);
      return 'severe';
    }
    if (text.includes('moderate') || text.includes('significant')) {
      console.log(`[SUPP.AI] Determined "moderate" severity based on evidence text keywords`);
      return 'moderate';
    }
    if (text.includes('mild') || text.includes('minor')) {
      console.log(`[SUPP.AI] Determined "minor" severity based on evidence text keywords`);
      return 'minor';
    }
  }
  
  console.log(`[SUPP.AI] Unable to determine severity, defaulting to "unknown"`);
  return "unknown";
}
