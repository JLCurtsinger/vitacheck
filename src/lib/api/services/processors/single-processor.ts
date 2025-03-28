
import { InteractionResult, InteractionSource, MedicationLookupResult } from '../../types';

/**
 * Process a single medication for adverse events and warnings
 */
export async function processSingleMedication(
  medication: string,
  medicationStatuses: Map<string, MedicationLookupResult>
): Promise<InteractionResult> {
  const medStatus = medicationStatuses.get(medication);
  
  if (!medStatus) {
    console.warn(`Medication status not found for ${medication}`);
    return {
      medications: [medication],
      severity: "unknown",
      description: "Medication information not found",
      sources: [{
        name: "No data available",
        severity: "unknown",
        description: "Medication information not found"
      }]
    };
  }
  
  // For single medications, we just use the warnings as sources
  const sources: InteractionSource[] = medStatus.warnings && medStatus.warnings.length > 0 
    ? medStatus.warnings.map(warning => ({
        name: "FDA Warnings",
        severity: "minor" as const,
        description: warning
      })) 
    : [{
        name: "FDA Information",
        severity: "unknown" as const,
        description: "No specific warnings found for this medication"
      }];
  
  // Ensure sources array is not empty
  if (sources.length === 0) {
    sources.push({
      name: "No Data Available",
      severity: "unknown" as const,
      description: "No information available for this medication"
    });
  }
  
  return {
    medications: [medication],
    severity: sources[0].severity,
    description: `Information about ${medication}`,
    sources
  };
}
