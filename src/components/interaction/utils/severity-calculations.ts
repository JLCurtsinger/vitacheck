
/**
 * Helper functions for calculating severity-related metrics and statistics
 */

/**
 * Gets CSS class name based on severity percentage
 */
export const getSeverityClass = (percent: number): string => {
  if (percent >= 1) return "text-red-700";
  if (percent >= 0.1) return "text-yellow-700";
  return "text-green-700";
};

/**
 * Calculate statistics for a data source based on available data
 */
export const calculateSourceStats = (source: {
  name: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  confidence?: number;
  eventData?: {
    totalEvents: number;
    seriousEvents: number;
    nonSeriousEvents: number;
  };
}) => {
  // Default values if data not available
  let totalCases = 0;
  let severeCases = 0;
  let moderateCases = 0;
  let minorCases = 0;
  
  // Use actual data from sources if available
  if (source.name === "OpenFDA Adverse Events" && source.eventData) {
    // We have real data from OpenFDA
    totalCases = source.eventData.totalEvents;
    severeCases = source.eventData.seriousEvents;
    // Estimate moderate and minor based on non-severe distribution
    const nonSevereCases = totalCases - severeCases;
    moderateCases = Math.round(nonSevereCases * 0.3); // Estimate 30% of non-severe as moderate
    minorCases = nonSevereCases - moderateCases;
  } else if (source.eventData) {
    // Use source-specific event data if available (from merged sources)
    totalCases = source.eventData.totalEvents;
    severeCases = source.eventData.seriousEvents;
    moderateCases = Math.round((totalCases - severeCases) * 0.3);
    minorCases = totalCases - severeCases - moderateCases;
  } else {
    // For other sources, use confidence as a proxy for data quality
    // but scale based on severity to make more realistic estimates
    const confidence = source.confidence || 0;
    
    // Base case count on confidence - higher confidence = more data points
    totalCases = Math.max(10, Math.round((confidence / 100) * 1000)); 
    
    // Distribute cases according to severity
    if (source.severity === "severe") {
      severeCases = Math.round(totalCases * 0.4);
      moderateCases = Math.round(totalCases * 0.4);
      minorCases = totalCases - severeCases - moderateCases;
    } else if (source.severity === "moderate") {
      severeCases = Math.round(totalCases * 0.05);
      moderateCases = Math.round(totalCases * 0.6);
      minorCases = totalCases - severeCases - moderateCases;
    } else if (source.severity === "minor") {
      severeCases = Math.round(totalCases * 0.01);
      moderateCases = Math.round(totalCases * 0.1);
      minorCases = totalCases - severeCases - moderateCases;
    } else if (source.severity === "safe") {
      severeCases = 0;
      moderateCases = Math.round(totalCases * 0.01);
      minorCases = Math.round(totalCases * 0.05);
    }
  }
  
  // Calculate severe percentage
  const severePercent = totalCases > 0 ? (severeCases / totalCases) * 100 : 0;
  
  // Calculate bar widths
  const severeWidth = totalCases > 0 ? (severeCases / totalCases) * 100 : 0;
  const moderateWidth = totalCases > 0 ? (moderateCases / totalCases) * 100 : 0;
  const minorWidth = totalCases > 0 ? (minorCases / totalCases) * 100 : 0;
  
  return {
    name: source.name,
    totalCases,
    severeCases,
    moderateCases,
    minorCases,
    severePercent,
    confidence: source.confidence || 0,
    severeWidth,
    moderateWidth,
    minorWidth,
    hasData: totalCases > 0
  };
};

/**
 * Calculate combined statistics from multiple sources
 */
export const calculateCombinedStats = (sourceStats: Array<ReturnType<typeof calculateSourceStats>>, confidenceScore?: number) => {
  // Calculate combined statistics using weighted approach
  const totalConfidence = sourceStats.reduce((sum, stat) => sum + stat.confidence, 0);
  const validSourceCount = sourceStats.filter(s => s.confidence > 0).length;
  
  // Create the aggregate "Final Combined Rating" row
  const weightedStats = {
    name: "Final Combined Rating",
    totalCases: sourceStats.reduce((sum, stat) => sum + stat.totalCases, 0),
    severeCases: sourceStats.reduce((sum, stat) => sum + stat.severeCases, 0),
    moderateCases: sourceStats.reduce((sum, stat) => sum + stat.moderateCases, 0),
    minorCases: sourceStats.reduce((sum, stat) => sum + stat.minorCases, 0),
    severePercent: 0,
    confidence: confidenceScore || (validSourceCount > 0 ? Math.round(totalConfidence / validSourceCount) : 0),
    hasData: sourceStats.some(s => s.hasData)
  };
  
  // Calculate combined severe percentage
  if (weightedStats.totalCases > 0) {
    weightedStats.severePercent = (weightedStats.severeCases / weightedStats.totalCases) * 100;
  }
  
  // Add bar graph percentages for combined stats
  const combinedTotalCases = weightedStats.totalCases;
  const combinedSevereWidth = combinedTotalCases > 0 ? (weightedStats.severeCases / combinedTotalCases) * 100 : 0;
  const combinedModerateWidth = combinedTotalCases > 0 ? (weightedStats.moderateCases / combinedTotalCases) * 100 : 0;
  const combinedMinorWidth = combinedTotalCases > 0 ? (weightedStats.minorCases / combinedTotalCases) * 100 : 0;
  
  return {
    ...weightedStats,
    severeWidth: combinedSevereWidth,
    moderateWidth: combinedModerateWidth,
    minorWidth: combinedMinorWidth
  };
};
