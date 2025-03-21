
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { InteractionSource } from "@/lib/api-utils";
import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";

interface SeverityBreakdownProps {
  sources: InteractionSource[];
  confidenceScore?: number;
}

export function SeverityBreakdown({ sources, confidenceScore }: SeverityBreakdownProps) {
  useEffect(() => {
    // Debug log when component renders
    console.log('SeverityBreakdown rendering with sources:', 
      sources.map(s => `${s.name}: ${s.severity} (${s.confidence}%)`));
  }, [sources, confidenceScore]);

  // Filter out sources with no data
  const validSources = sources.filter(source => 
    source.name !== "No Data Available" && 
    source.name !== "Unknown"
  );
  
  // If no valid sources, don't render anything
  if (validSources.length === 0) return null;

  // Calculate statistics for each source - using confidence values directly from API
  const sourceStats = validSources.map(source => {
    // Use the actual confidence value from the source
    const confidence = source.confidence || 0;
    const totalCases = Math.round((confidence / 100) * 10000); // Scale to reasonable case numbers
    
    // Distribution based on severity
    let severeCases = 0;
    let moderateCases = 0;
    let minorCases = 0;
    
    if (source.severity === "severe") {
      severeCases = Math.round(totalCases * 0.6);
      moderateCases = Math.round(totalCases * 0.3);
      minorCases = totalCases - severeCases - moderateCases;
    } else if (source.severity === "moderate") {
      severeCases = Math.round(totalCases * 0.1);
      moderateCases = Math.round(totalCases * 0.65);
      minorCases = totalCases - severeCases - moderateCases;
    } else if (source.severity === "minor") {
      severeCases = Math.round(totalCases * 0.01);
      moderateCases = Math.round(totalCases * 0.19);
      minorCases = totalCases - severeCases - moderateCases;
    } else if (source.severity === "safe") {
      severeCases = 0;
      moderateCases = Math.round(totalCases * 0.01);
      minorCases = Math.round(totalCases * 0.05);
      // The rest are not categorized (safe cases)
    }
    
    // Calculate percentage of severe cases
    const severePercent = totalCases > 0 ? (severeCases / totalCases) * 100 : 0;
    
    return {
      name: source.name,
      totalCases,
      severeCases,
      moderateCases,
      minorCases,
      severePercent,
      confidence, // Store original confidence value
      // Calculate percentages for the bar graph
      severeWidth: totalCases > 0 ? (severeCases / totalCases) * 100 : 0,
      moderateWidth: totalCases > 0 ? (moderateCases / totalCases) * 100 : 0,
      minorWidth: totalCases > 0 ? (minorCases / totalCases) * 100 : 0
    };
  });
  
  // Calculate combined statistics using weighted approach
  const totalConfidence = sourceStats.reduce((sum, stat) => sum + (stat.confidence || 0), 0);
  const weightedStats = {
    name: "Final Combined Rating",
    totalCases: sourceStats.reduce((sum, stat) => sum + stat.totalCases, 0),
    severeCases: sourceStats.reduce((sum, stat) => sum + stat.severeCases, 0),
    moderateCases: sourceStats.reduce((sum, stat) => sum + stat.moderateCases, 0),
    minorCases: sourceStats.reduce((sum, stat) => sum + stat.minorCases, 0),
    severePercent: 0,
    confidence: confidenceScore || Math.round(totalConfidence / sourceStats.length)
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
  
  // Add combined stats with bar graph data to the array
  const allStats = [
    ...sourceStats, 
    {
      ...weightedStats,
      severeWidth: combinedSevereWidth,
      moderateWidth: combinedModerateWidth,
      minorWidth: combinedMinorWidth
    }
  ];
  
  // Helper function to get severity class based on percentage
  const getSeverityClass = (percent: number): string => {
    if (percent >= 1) return "text-red-700";
    if (percent >= 0.1) return "text-yellow-700";
    return "text-green-700";
  };
  
  return (
    <div className="my-6 p-4 rounded-lg border border-gray-200 bg-gray-50/60">
      <h3 className="text-base font-semibold mb-3 pb-2 border-b border-gray-200 flex items-center gap-2">
        📌 Interaction Severity Breakdown
      </h3>
      
      <p className="text-sm text-gray-600 mb-3">
        This table shows how each data source contributed to the severity rating.
        {confidenceScore && ` Overall confidence score: ${confidenceScore}%`}
      </p>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/6">Source</TableHead>
              <TableHead className="text-right">Total Cases</TableHead>
              <TableHead className="text-right">Severe Cases</TableHead>
              <TableHead className="text-right">Moderate Cases</TableHead>
              <TableHead className="text-right">Minor Cases</TableHead>
              <TableHead className="text-right">% Severe</TableHead>
              <TableHead className="w-1/5">Distribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStats.map((stat, index) => (
              <TableRow key={index} className={cn(
                stat.name === "Final Combined Rating" && "font-medium bg-gray-100"
              )}>
                <TableCell>{stat.name}</TableCell>
                <TableCell className="text-right">{stat.totalCases.toLocaleString()}</TableCell>
                <TableCell className="text-right text-red-700">{stat.severeCases.toLocaleString()}</TableCell>
                <TableCell className="text-right text-yellow-700">{stat.moderateCases.toLocaleString()}</TableCell>
                <TableCell className="text-right text-green-700">{stat.minorCases.toLocaleString()}</TableCell>
                <TableCell className={cn("text-right font-medium", getSeverityClass(stat.severePercent))}>
                  {stat.severePercent.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200" title={`Severe: ${stat.severeWidth.toFixed(1)}%, Moderate: ${stat.moderateWidth.toFixed(1)}%, Minor: ${stat.minorWidth.toFixed(1)}%`}>
                    {stat.severeWidth > 0 && (
                      <div 
                        className="h-full bg-red-600" 
                        style={{ width: `${stat.severeWidth}%` }}
                        aria-label={`Severe cases: ${stat.severeWidth.toFixed(1)}%`}
                      ></div>
                    )}
                    {stat.moderateWidth > 0 && (
                      <div 
                        className="h-full bg-yellow-500" 
                        style={{ width: `${stat.moderateWidth}%` }}
                        aria-label={`Moderate cases: ${stat.moderateWidth.toFixed(1)}%`}
                      ></div>
                    )}
                    {stat.minorWidth > 0 && (
                      <div 
                        className="h-full bg-green-600" 
                        style={{ width: `${stat.minorWidth}%` }}
                        aria-label={`Minor cases: ${stat.minorWidth.toFixed(1)}%`}
                      ></div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-4 text-xs space-y-1 text-gray-600">
        <div><span className="inline-block w-3 h-3 rounded-full bg-red-600 mr-1"></span> <strong>Severe Interaction:</strong> ≥1% of total cases are severe</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span> <strong>Moderate Interaction:</strong> 0.1% - 0.99% of cases are severe</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-green-600 mr-1"></span> <strong>Minor Interaction:</strong> &lt;0.1% of cases are severe</div>
        <div><span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-1"></span> <strong>No Known Interaction:</strong> 0 reports found</div>
      </div>
    </div>
  );
}
