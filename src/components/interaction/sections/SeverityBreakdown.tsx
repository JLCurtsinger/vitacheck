import { SeverityLegend } from "./severity/SeverityLegend";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { SourceDetailsModal } from "../modal/SourceDetailsModal";
import { useSeverityBreakdown } from "./severityBreakdown/useSeverityBreakdown";
import { SeverityBreakdownTable } from "./severityBreakdown/SeverityBreakdownTable";
import { InteractionSource, AdverseEventData } from "@/lib/api-utils";

interface SeverityBreakdownProps {
  sources: InteractionSource[];
  confidenceScore?: number;
  adverseEvents?: AdverseEventData;
  medications?: string[];
}

export function SeverityBreakdown({ 
  sources, 
  confidenceScore, 
  adverseEvents,
  medications = []
}: SeverityBreakdownProps) {
  const {
    allStats,
    validSources,
    sourceModalOpen,
    selectedSource,
    onRowClick,
    closeModal
  } = useSeverityBreakdown({
    sources, confidenceScore, adverseEvents, medications
  });

  if (validSources.length === 0) return null;

  return (
    <>
      <div className="my-6 p-4 rounded-lg border border-gray-200 bg-gray-50/60">
        <div className="mb-3 pb-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold flex items-center gap-2">
              📌 Interaction Severity Breakdown
            </h3>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">
          This table shows how each data source contributed to the severity rating.
        </p>
        <SeverityBreakdownTable 
          allStats={allStats}
          validSources={validSources}
          onRowClick={onRowClick}
        />
        <SeverityLegend />
      </div>
      <SourceDetailsModal
        isOpen={sourceModalOpen}
        onClose={closeModal}
        source={selectedSource}
      />
    </>
  );
}
