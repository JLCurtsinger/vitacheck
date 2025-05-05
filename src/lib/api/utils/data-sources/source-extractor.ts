
/**
 * Source Data Extractor
 * 
 * Utility functions to extract and process source data from different API results
 */

import { InteractionSource, StandardizedApiResponse } from '../../types';

/**
 * Extract usable sources from interactions for fallback processing
 */
export function extractSourcesFromInteractions(sources: {
  rxnormResult?: StandardizedApiResponse | null;
  suppaiResult?: StandardizedApiResponse | null;
  fdaResult?: StandardizedApiResponse | null;
  adverseEventsResult?: any | null;
}): InteractionSource[] {
  const result: InteractionSource[] = [];
  
  // Process RxNorm
  if (sources.rxnormResult && sources.rxnormResult.severity) {
    result.push({
      name: 'RxNorm',
      severity: sources.rxnormResult.severity as any,
      description: sources.rxnormResult.description || 'RxNorm interaction data',
      confidence: sources.rxnormResult.confidence || 80
    });
  }
  
  // Process SUPP.AI
  if (sources.suppaiResult && sources.suppaiResult.severity) {
    result.push({
      name: 'SUPP.AI',
      severity: sources.suppaiResult.severity as any,
      description: sources.suppaiResult.description || 'SUPP.AI interaction data',
      confidence: sources.suppaiResult.confidence || 70
    });
  }
  
  // Process FDA
  if (sources.fdaResult && sources.fdaResult.severity) {
    result.push({
      name: 'FDA',
      severity: sources.fdaResult.severity as any,
      description: sources.fdaResult.description || 'FDA interaction data',
      confidence: sources.fdaResult.confidence || 85
    });
  }
  
  // Process Adverse Events
  if (sources.adverseEventsResult) {
    const eventCount = sources.adverseEventsResult.eventCount || 0;
    const seriousCount = sources.adverseEventsResult.seriousCount || 0;
    
    if (eventCount > 0) {
      // Calculate a severity based on event count and serious percentage
      let severity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
      const seriousPercentage = eventCount > 0 ? (seriousCount / eventCount) * 100 : 0;
      
      if (seriousPercentage > 25 || seriousCount > 100) severity = "severe";
      else if (seriousPercentage > 10 || seriousCount > 50) severity = "moderate";
      else if (eventCount > 10) severity = "minor";
      else severity = "unknown";
      
      result.push({
        name: 'OpenFDA Adverse Events',
        severity,
        description: `${eventCount} adverse events reported, including ${seriousCount} serious cases`,
        confidence: 90,
        eventData: {
          totalEvents: eventCount,
          seriousEvents: seriousCount,
          nonSeriousEvents: eventCount - seriousCount,
          seriousPercentage,
          commonReactions: sources.adverseEventsResult.commonReactions || []
        }
      });
    }
  }
  
  return result;
}

/**
 * Extract key data points from a description text for structured analysis
 */
export function extractDataPointsFromDescription(text: string): Record<string, string> {
  const dataPoints: Record<string, string> = {};
  
  // Try to extract severity
  const severityMatch = text.match(/severity[:\s]+(\w+)/i);
  if (severityMatch && severityMatch[1]) {
    dataPoints.severity = severityMatch[1].toLowerCase();
  }
  
  // Try to extract risk
  const riskMatch = text.match(/risk[:\s]+(low|moderate|high|severe)/i);
  if (riskMatch && riskMatch[1]) {
    dataPoints.risk = riskMatch[1].toLowerCase();
  }
  
  // Try to extract mechanism
  const mechanismMatch = text.match(/mechanism[:\s]+([^\.]+)/i);
  if (mechanismMatch && mechanismMatch[1]) {
    dataPoints.mechanism = mechanismMatch[1].trim();
  }
  
  return dataPoints;
}
