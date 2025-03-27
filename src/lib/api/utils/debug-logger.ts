
/**
 * Debug Logger
 * 
 * Utilities for logging debug information specific to interaction checking
 */

import { InteractionSource } from '../types';

/**
 * Logs detailed information about sources before they are added to the final list
 */
export function logSourceSeverityIssues(
  source: InteractionSource,
  context: string = ''
): void {
  // Log the source details
  console.log(`[Debug] Source severity check (${context}):`, {
    name: source.name,
    severity: source.severity,
    confidence: source.confidence,
    descriptionLength: source.description ? source.description.length : 0,
    hasEventData: !!source.eventData
  });
  
  // Check for potential issues
  const issues = [];
  
  if (!source.severity || source.severity === 'unknown') {
    issues.push('Missing or unknown severity');
  }
  
  if (!source.description || source.description.length < 10) {
    issues.push('Missing or very short description');
  }
  
  if (source.confidence === undefined || source.confidence === null) {
    issues.push('Missing confidence score');
  } else if (source.confidence < 50) {
    issues.push('Low confidence score');
  }
  
  // Log any issues found
  if (issues.length > 0) {
    console.warn(`[Debug] Source "${source.name || 'Unnamed'}" has issues: ${issues.join(', ')}`);
  }
}

/**
 * Creates a diagnostic report for a complete interaction check
 */
export function createInteractionDiagnosticReport(
  medications: string[],
  interactionResults: any,
  rawResponses: Record<string, any>
): void {
  console.log('=================================================');
  console.log(`INTERACTION DIAGNOSTIC REPORT: ${medications.join(' + ')}`);
  console.log('=================================================');
  
  // Log the medications being checked
  console.log('Medications:', medications);
  
  // Log the final interaction results
  console.log('Final results:', {
    severity: interactionResults.severity,
    confidenceScore: interactionResults.confidenceScore,
    sourcesCount: interactionResults.sources?.length || 0,
    hasAdverseEvents: !!interactionResults.adverseEvents
  });
  
  // Summarize sources by type
  const sourceTypes = {};
  if (interactionResults.sources) {
    interactionResults.sources.forEach(source => {
      const type = source.name || 'Unknown';
      sourceTypes[type] = (sourceTypes[type] || 0) + 1;
    });
  }
  
  console.log('Sources by type:', sourceTypes);
  
  // Log source validation issues
  if (interactionResults.sources) {
    const issueCount = interactionResults.sources.filter(
      s => !s.severity || s.severity === 'unknown' || !s.confidence
    ).length;
    
    if (issueCount > 0) {
      console.warn(`Found ${issueCount} sources with validation issues`);
    }
  }
  
  console.log('=================================================');
  console.log('End of diagnostic report');
  console.log('=================================================');
}
