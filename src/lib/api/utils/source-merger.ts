
import { InteractionSource } from '../types';
import { getMostSevereSeverity } from './severity-helpers';

/**
 * Merges sources from the same origin
 */
export function mergeSources(sources: InteractionSource[]): InteractionSource[] {
  // Group sources by name to handle deduplication properly
  const sourceGroups = new Map<string, InteractionSource[]>();
  
  // Sort sources by name for deterministic processing
  const sortedSources = [...sources].sort((a, b) => a.name.localeCompare(b.name));
  
  // Collect all sources and group them by name
  sortedSources.forEach(source => {
    if (!sourceGroups.has(source.name)) {
      sourceGroups.set(source.name, []);
    }
    sourceGroups.get(source.name)!.push(source);
  });
  
  // Merge sources from the same origin (e.g., FDA, OpenFDA, etc.)
  const mergedSources: InteractionSource[] = [];
  
  // Process source groups in alphabetical order for consistency
  const sortedSourceNames = Array.from(sourceGroups.keys()).sort();
  
  for (const sourceName of sortedSourceNames) {
    // Skip sources with no data
    if (sourceName === "No Data Available" || sourceName === "Unknown") {
      continue;
    }
    
    const sources = sourceGroups.get(sourceName)!;
    
    // If we only have one source of this type, add it directly
    if (sources.length === 1) {
      mergedSources.push(sources[0]);
      continue;
    }
    
    // When we have multiple sources of the same type, merge them
    const mergedSource: InteractionSource = {
      name: sourceName,
      // Take the highest severity as the overall severity for this source
      severity: getMostSevereSeverity(sources.map(s => s.severity)),
      // Create a combined description or use the first one
      description: sources[0].description,
      // Average the confidence values if available
      confidence: Math.round(sources.reduce((sum, s) => sum + (s.confidence || 0), 0) / sources.length)
    };
    
    // Add event data if available (from OpenFDA Adverse Events)
    if (sources.some(s => s.eventData)) {
      const eventData = {
        totalEvents: 0,
        seriousEvents: 0,
        nonSeriousEvents: 0
      };
      
      sources.forEach(s => {
        if (s.eventData) {
          eventData.totalEvents += s.eventData.totalEvents || 0;
          eventData.seriousEvents += s.eventData.seriousEvents || 0;
          eventData.nonSeriousEvents += s.eventData.nonSeriousEvents || 0;
        }
      });
      
      mergedSource.eventData = eventData;
    }
    
    mergedSources.push(mergedSource);
  }
  
  return mergedSources;
}
