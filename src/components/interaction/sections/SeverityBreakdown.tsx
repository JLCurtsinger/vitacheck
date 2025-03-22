
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InteractionSource, AdverseEventData } from "@/lib/api-utils";
import { useEffect } from "react";
import { calculateSourceStats, calculateCombinedStats } from "../utils/severity-calculations";
import { SeverityTableRow } from "./severity/SeverityTableRow";
import { SeverityLegend } from "./severity/SeverityLegend";

interface SeverityBreakdownProps {
  sources: InteractionSource[];
  confidenceScore?: number;
  adverseEvents?: AdverseEventData;
}

export function SeverityBreakdown({ sources, confidenceScore, adverseEvents }: SeverityBreakdownProps) {
  useEffect(() => {
    // Debug log when component renders
    console.log('SeverityBreakdown rendering with sources:', 
      sources.map(s => `${s.name}: ${s.severity} (${s.confidence}%)`));
    
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

  // Process source statistics for each source
  const sourceStats = validSources.map(source => calculateSourceStats(source));
  
  // Calculate combined statistics
  const weightedStats = calculateCombinedStats(sourceStats, confidenceScore);
  
  // Combine all stats for display
  const allStats = [...sourceStats, weightedStats];
  
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
