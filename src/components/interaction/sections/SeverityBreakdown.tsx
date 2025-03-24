
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource, AdverseEventData } from "@/lib/api-utils";
import { useEffect } from "react";
import { calculateSourceStats, calculateCombinedStats } from "../utils/severity-calculations";
import { SeverityTableRow } from "./severity/SeverityTableRow";
import { SeverityLegend } from "./severity/SeverityLegend";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface SeverityBreakdownProps {
  sources: InteractionSource[];
  confidenceScore?: number;
  adverseEvents?: AdverseEventData;
}

export function SeverityBreakdown({ sources, confidenceScore, adverseEvents }: SeverityBreakdownProps) {
  useEffect(() => {
    // Debug log when component renders
    console.log('SeverityBreakdown rendering with sources:', 
      sources.map(s => `${s.name}: ${s.severity} (${s.confidence || 'N/A'}%)`));
    
    if (adverseEvents) {
      console.log('Adverse events data:', {
        eventCount: adverseEvents.eventCount,
        seriousCount: adverseEvents.seriousCount,
        seriousPercentage: adverseEvents.eventCount > 0 ? 
          (adverseEvents.seriousCount / adverseEvents.eventCount) * 100 : 0
      });
    }
  }, [sources, confidenceScore, adverseEvents]);

  // Filter out sources with no data
  const validSources = sources.filter(source => 
    source.name !== "No Data Available" && 
    source.name !== "Unknown"
  );
  
  // If no valid sources, don't render anything
  if (validSources.length === 0) return null;

  // Check if we have an OpenFDA source already
  const hasOpenFDASource = validSources.some(source => 
    source.name === "OpenFDA Adverse Events"
  );

  // If we have adverse events data but no OpenFDA source, create one
  if (adverseEvents && adverseEvents.eventCount > 0 && !hasOpenFDASource) {
    const seriousPercentage = adverseEvents.seriousCount / adverseEvents.eventCount;
    
    validSources.push({
      name: "OpenFDA Adverse Events",
      severity: seriousPercentage >= 0.05 ? "severe" : 
                seriousPercentage >= 0.01 ? "moderate" : "minor",
      description: `${adverseEvents.eventCount.toLocaleString()} adverse events reported, with ${adverseEvents.seriousCount.toLocaleString()} serious cases (${(seriousPercentage * 100).toFixed(2)}%).`,
      confidence: 95, // Real-world data has high confidence
      eventData: {
        totalEvents: adverseEvents.eventCount,
        seriousEvents: adverseEvents.seriousCount,
        nonSeriousEvents: adverseEvents.eventCount - adverseEvents.seriousCount,
        seriousPercentage
      }
    });
  }
  
  // Process source statistics for each source
  const sourceStats = validSources.map(source => calculateSourceStats(source));
  
  // Calculate combined statistics with confidence score
  const weightedStats = calculateCombinedStats(sourceStats, confidenceScore);
  
  // Debug the final stats
  console.log('Severity stats:', {
    sourceStats: sourceStats.map(s => ({
      name: s.name,
      totalCases: s.totalCases,
      severeCases: s.severeCases,
      severePercent: s.severePercent,
      hasData: s.hasData
    })),
    combinedStats: {
      totalCases: weightedStats.totalCases,
      severeCases: weightedStats.severeCases,
      severePercent: weightedStats.severePercent,
      hasData: weightedStats.hasData
    }
  });
  
  // Combine all stats for display
  const allStats = [...sourceStats, weightedStats];
  
  return (
    <div className="my-6 p-4 rounded-lg border border-gray-200 bg-gray-50/60">
      <div className="mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold flex items-center gap-2">
            📌 Interaction Severity Breakdown
          </h3>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-sm text-blue-600 cursor-help">
                  <Info className="h-4 w-4 mr-1" />
                  Confidence: {confidenceScore || 0}%
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Confidence is calculated from weighted source data. OpenFDA Adverse Events is given the highest weight when available due to its direct reporting on adverse outcomes from combining the selected medications or supplements.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        This table shows how each data source contributed to the severity rating.
      </p>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/6">Source</TableHead>
              <TableHead className="text-right">Total Cases</TableHead>
              <TableHead className="text-right text-red-700">Severe Cases</TableHead>
              <TableHead className="text-right text-yellow-700">Moderate Cases</TableHead>
              <TableHead className="text-right text-green-700">Minor Cases</TableHead>
              <TableHead className="text-right">% Severe</TableHead>
              <TableHead className="w-1/5">Distribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allStats.map((stat, index) => (
              <SeverityTableRow 
                key={index}
                stat={stat}
                isCombined={stat.name === "Final Combined Rating"}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      
      <SeverityLegend />
    </div>
  );
}
