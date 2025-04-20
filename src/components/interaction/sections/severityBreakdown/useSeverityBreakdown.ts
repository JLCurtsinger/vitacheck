
import { useState, useCallback, useEffect } from "react";
import { InteractionSource, AdverseEventData } from "@/lib/api-utils";
import { calculateSourceStats, calculateCombinedStats } from "../../utils/severity-calculations";

export function useSeverityBreakdown({
  sources,
  confidenceScore,
  adverseEvents,
  medications = []
}: {
  sources: InteractionSource[];
  confidenceScore?: number;
  adverseEvents?: AdverseEventData;
  medications: string[];
}) {
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState<{
    name: string;
    data: InteractionSource[];
    medications: string[];
  } | null>(null);

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

  // If we have adverse events but no OpenFDA Adverse Events source, add it
  const hasOpenFDASource = validSources.some(source => 
    source.name === "OpenFDA Adverse Events"
  );
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

  // Don't render table if no valid sources (handled by main file)
  // Process source statistics for each source
  const sourceStats = validSources.map(source => calculateSourceStats(source));
  const weightedStats = calculateCombinedStats(sourceStats, confidenceScore);

  const allStats = [...sourceStats, weightedStats];

  // Row click: open source details modal
  const onRowClick = useCallback(
    (statName: string) => {
      // Don't allow click on final combined row
      if (statName === "Final Combined Rating") return;
      const matchedSource = validSources.find(
        source => source.name.toLowerCase() === statName.toLowerCase()
      );
      if (!matchedSource) return;
      setSelectedSource({
        name: matchedSource.name,
        data: [matchedSource],
        medications: medications
      });
      setSourceModalOpen(true);
    },
    [validSources, medications]
  );

  const closeModal = useCallback(() => {
    setSourceModalOpen(false);
    setSelectedSource(null);
  }, []);

  return {
    allStats,
    validSources,
    sourceModalOpen,
    selectedSource,
    onRowClick,
    closeModal
  };
}
