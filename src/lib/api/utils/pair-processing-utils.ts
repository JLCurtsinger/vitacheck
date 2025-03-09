
/**
 * Medication Pair Processing Utilities
 * 
 * This module handles the core logic for processing medication pairs and determining
 * interaction severity based on multiple data sources. It implements a comprehensive
 * checking system that queries multiple medical databases and aggregates their results.
 * 
 * @module pair-processing-utils
 */

import { InteractionResult, MedicationLookupResult, InteractionSource } from '../types';
import { checkRxNormInteractions } from '../services/interactions/rxnorm-interactions';
import { checkSuppAiInteractions } from '../services/interactions/suppai-interactions';
import { checkFDAInteractions } from '../services/interactions/fda-interactions';
import { checkHighRiskCombination } from './high-risk-interactions';
import { getAdverseEvents } from '../openfda-events';

type Severity = "safe" | "minor" | "severe" | "unknown";

/**
 * Generates all possible unique pairs of medications from an input array
 * @param medications - Array of medication names to generate pairs from
 * @returns Array of medication name pairs
 */
export function generateMedicationPairs(medications: string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  const processedPairs = new Set<string>();
  
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const pair = [medications[i], medications[j]].sort();
      const pairKey = pair.join('-');
      
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        pairs.push([medications[i], medications[j]]);
      }
    }
  }
  
  return pairs;
}

/**
 * Processes a pair of medications to determine potential interactions
 * 
 * This function:
 * 1. Queries multiple medical databases (RxNorm, SUPP.AI, FDA) simultaneously
 * 2. Aggregates and merges the results from all sources
 * 3. Determines the final severity rating based on all available data
 * 4. Ensures interactions are always displayed if any API detects them
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @param medicationStatuses - Map of medication lookup results
 * @returns Processed interaction result with severity and warnings
 */
export async function processMedicationPair(
  med1: string,
  med2: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  const med1Status = medicationStatuses.get(med1)!;
  const med2Status = medicationStatuses.get(med2)!;
  
  // First check for known high-risk combinations
  const highRiskCheck = checkHighRiskCombination(med1, med2);
  if (highRiskCheck.isHighRisk) {
    return {
      medications: [med1, med2],
      severity: "severe" as const,
      description: highRiskCheck.description || "High risk combination detected",
      sources: [{
        name: "VitaCheck Safety Database",
        severity: "severe" as const,
        description: highRiskCheck.description
      }]
    };
  }

  console.log(`Checking interactions between ${med1} (${med1Status.id || 'no id'}) and ${med2} (${med2Status.id || 'no id'})`);

  // Query all available databases simultaneously to maintain the existing parallel API call pattern
  const results = await Promise.all([
    // Only check RxNorm if both medications have RxNorm IDs
    med1Status.source === 'RxNorm' && med2Status.source === 'RxNorm' && med1Status.id && med2Status.id
      ? checkRxNormInteractions(med1Status.id, med2Status.id, med1, med2)
      : Promise.resolve(null),
    checkSuppAiInteractions(med1, med2),
    checkFDAInteractions(med1Status.warnings || [], med2Status.warnings || []),
    // Add the new OpenFDA Adverse Events check
    getAdverseEvents(med1, med2)
  ]);

  // Destructure results for clarity
  const [rxnormResult, suppaiResult, fdaResult, adverseEventsResult] = results;
  
  console.log('API Results:', {
    rxnorm: rxnormResult ? `Found: ${rxnormResult.severity}` : 'No data',
    suppai: suppaiResult ? `Found: ${suppaiResult.severity}` : 'No data',
    fda: fdaResult ? `Found: ${fdaResult.severity}` : 'No data',
    adverseEvents: adverseEventsResult ? `Found ${adverseEventsResult.eventCount} events` : 'No data'
  });

  // Merge all sources from different APIs
  const sources: InteractionSource[] = [];
  if (rxnormResult) sources.push(...rxnormResult.sources);
  if (suppaiResult) sources.push(...suppaiResult.sources);
  if (fdaResult) sources.push(...fdaResult.sources);
  
  // Add adverse events as a source if found
  if (adverseEventsResult && adverseEventsResult.eventCount > 0) {
    // Determine severity based on the number and seriousness of reports
    const adverseEventSeverity: Severity = 
      adverseEventsResult.seriousCount > 0 ? "severe" : 
      adverseEventsResult.eventCount > 5 ? "minor" : "unknown";
    
    // Create a description for the adverse events
    const reactionsList = adverseEventsResult.commonReactions.length > 0 
      ? `. Common reported reactions include: ${adverseEventsResult.commonReactions.join(', ')}.`
      : '';
    
    const severityText = adverseEventsResult.seriousCount > 0 
      ? 'serious' 
      : 'potential';
    
    const description = `Real-world data shows ${adverseEventsResult.eventCount} reported ${severityText} adverse events for this combination${reactionsList} Consult a healthcare provider before combining.`;
    
    sources.push({
      name: "FDA Adverse Events",
      severity: adverseEventSeverity,
      description
    });
  }

  // Track interaction statuses across all APIs
  let hasAnyInteraction = false;
  let hasExplicitSafety = false;
  let hasUnknownStatus = false;
  let mostSevereDescription = "No information found for this combination. Consult a healthcare provider for more details.";
  let mostSeverity: Severity = "unknown";

  // Analyze results from all APIs to determine overall severity
  for (const result of [rxnormResult, suppaiResult, fdaResult]) {
    if (!result) continue;
    
    // If any API reports an interaction, we consider there is an interaction
    if (result.severity === "minor" || result.severity === "severe") {
      hasAnyInteraction = true;
      
      // Track the most severe interaction and its description
      if (
        (result.severity === "severe") || 
        (result.severity === "minor" && mostSeverity !== "severe")
      ) {
        mostSeverity = result.severity;
        mostSevereDescription = result.description;
      }
    }
    
    // Track if any API explicitly confirms safety
    if (result.severity === "safe") {
      hasExplicitSafety = true;
    }
    
    // Track if any API returns unknown status
    if (result.severity === "unknown") {
      hasUnknownStatus = true;
    }
  }
  
  // If we have adverse events data, factor it into the severity determination
  if (adverseEventsResult && adverseEventsResult.eventCount > 0) {
    hasAnyInteraction = true;
    
    if (adverseEventsResult.seriousCount > 0) {
      // This is the fix - we now check if the current mostSeverity is different from "severe"
      // Instead of comparing "minor" == "severe" which causes the type error
      if (mostSeverity !== "severe") {
        mostSeverity = "severe";
        mostSevereDescription = `Real-world data shows ${adverseEventsResult.eventCount} reported adverse events (including ${adverseEventsResult.seriousCount} serious cases) for this combination. Consult a healthcare provider before combining.`;
      }
    } else if (adverseEventsResult.eventCount > 5) {
      // Similarly fixed here
      if (mostSeverity !== "severe") {
        mostSeverity = "minor";
        mostSevereDescription = `Real-world data shows ${adverseEventsResult.eventCount} reported adverse events for this combination. Monitor for side effects and consult a healthcare provider if concerned.`;
      }
    }
  }

  // Determine final result based on merged data
  let finalSeverity: Severity;
  let finalDescription: string;
  
  if (hasAnyInteraction) {
    // If any API reports an interaction, use the most severe level
    finalSeverity = mostSeverity;
    finalDescription = mostSevereDescription;
  } else if (hasExplicitSafety && !hasAnyInteraction) {
    // Only mark as safe if at least one API explicitly confirms safety and no API reports interactions
    finalSeverity = "safe";
    finalDescription = "Verified safe to take together based on available data. Always consult your healthcare provider.";
  } else {
    // Default case - no clear information available
    finalSeverity = "unknown";
    finalDescription = "No information found for this combination. Consult a healthcare provider for more details.";
  }

  // Ensure we always have at least one source entry
  if (sources.length === 0) {
    sources.push({
      name: "No Data Available",
      severity: "unknown",
      description: "No interaction data available from any source"
    });
  }

  return {
    medications: [med1, med2],
    severity: finalSeverity,
    description: finalDescription,
    sources,
    adverseEvents: adverseEventsResult || undefined
  };
}
