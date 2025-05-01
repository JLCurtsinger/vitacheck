
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
    seriousPercentage?: number;
  };
}) => {
  // Default values if data not available
  let totalCases = 0;
  let severeCases = 0;
  let moderateCases = 0;
  let minorCases = 0;
  let hasData = false;
  
  // Use actual data from sources if available
  if (source.name === "OpenFDA Adverse Events" && source.eventData) {
    // We have real data from OpenFDA
    totalCases = source.eventData.totalEvents || 0;
    severeCases = source.eventData.seriousEvents || 0;
    // Estimate moderate and minor based on non-severe distribution
    const nonSevereCases = totalCases - severeCases;
    moderateCases = Math.round(nonSevereCases * 0.3); // Estimate 30% of non-severe as moderate
    minorCases = nonSevereCases - moderateCases;
    hasData = totalCases > 0;
  } else if (source.eventData) {
    // Use source-specific event data if available (from merged sources)
    totalCases = source.eventData.totalEvents || 0;
    severeCases = source.eventData.seriousEvents || 0;
    moderateCases = Math.round((totalCases - severeCases) * 0.3);
    minorCases = totalCases - severeCases - moderateCases;
    hasData = totalCases > 0;
  } else {
    // For other sources, use confidence as a proxy for data quality
    // but scale based on severity to make more realistic estimates
    const confidence = source.confidence || 0;
    
    // Only consider sources with positive confidence
    if (confidence > 0) {
      hasData = true;
      
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
  }
  
  // Calculate severe percentage - safeguard against division by zero
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
    hasData
  };
};

/**
 * Calculate combined statistics from multiple sources
 */
export const calculateCombinedStats = (sourceStats: Array<ReturnType<typeof calculateSourceStats>>, confidenceScore?: number) => {
  // Filter out sources with no data
  const validStats = sourceStats.filter(stat => stat.hasData);
  
  // If no valid sources, return empty combined stats
  if (validStats.length === 0) {
    return {
      name: "Final Combined Rating",
      totalCases: 0,
      severeCases: 0,
      moderateCases: 0,
      minorCases: 0,
      severePercent: 0,
      confidence: confidenceScore || 0,
      severeWidth: 0,
      moderateWidth: 0,
      minorWidth: 0,
      hasData: false
    };
  }
  
  // Instead of weighted calculations, sum up all cases directly
  let totalCases = 0;
  let severeCases = 0;
  let moderateCases = 0;
  let minorCases = 0;
  
  // Sum up all cases from all sources
  validStats.forEach(stat => {
    // Skip invalid data
    if (isNaN(stat.totalCases) || stat.totalCases <= 0) return;
    
    totalCases += stat.totalCases;
    severeCases += stat.severeCases;
    moderateCases += stat.moderateCases;
    minorCases += stat.minorCases;
  });
  
  // Calculate severe percentage for the combined total
  const severePercent = totalCases > 0 ? (severeCases / totalCases) * 100 : 0;
  
  // Calculate distribution widths for the bar chart
  const severeWidth = totalCases > 0 ? (severeCases / totalCases) * 100 : 0;
  const moderateWidth = totalCases > 0 ? (moderateCases / totalCases) * 100 : 0;
  const minorWidth = totalCases > 0 ? (minorCases / totalCases) * 100 : 0;
  
  // Return the combined stats
  return {
    name: "Final Combined Rating",
    totalCases,
    severeCases,
    moderateCases,
    minorCases,
    severePercent,
    confidence: confidenceScore || 0,
    severeWidth,
    moderateWidth,
    minorWidth,
    hasData: true
  };
};
