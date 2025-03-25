
import { InteractionResult } from "@/lib/api-utils";
import { cn } from "@/lib/utils";

interface CombinedSeverityContainerProps {
  interactions: InteractionResult[];
  totalMedications: number;
}

export function CombinedSeverityContainer({ interactions, totalMedications }: CombinedSeverityContainerProps) {
  // Count interactions by severity
  const severityCounts = {
    severe: interactions.filter(i => i.severity === "severe").length,
    moderate: interactions.filter(i => i.severity === "moderate").length,
    minor: interactions.filter(i => i.severity === "minor").length,
    safe: interactions.filter(i => i.severity === "safe").length,
    unknown: interactions.filter(i => i.severity === "unknown").length
  };
  
  // Calculate total possible pairs (n choose 2)
  const possiblePairs = totalMedications * (totalMedications - 1) / 2;
  
  // Only show if we have any interactions
  if (interactions.length === 0) return null;

  return (
    <div className="mb-6 bg-white p-4 border rounded-lg">
      <h3 className="text-base font-semibold mb-3 pb-2 border-b text-gray-700">
        Interaction Breakdown
      </h3>
      
      <div className="space-y-4">
        {/* Severity distribution bar */}
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
          {severityCounts.severe > 0 && (
            <div 
              className="bg-red-500 h-full" 
              style={{ width: `${(severityCounts.severe / possiblePairs) * 100}%` }}
              title={`${severityCounts.severe} severe interaction${severityCounts.severe > 1 ? 's' : ''}`}
            />
          )}
          
          {severityCounts.moderate > 0 && (
            <div 
              className="bg-yellow-500 h-full" 
              style={{ width: `${(severityCounts.moderate / possiblePairs) * 100}%` }}
              title={`${severityCounts.moderate} moderate interaction${severityCounts.moderate > 1 ? 's' : ''}`}
            />
          )}
          
          {severityCounts.minor > 0 && (
            <div 
              className="bg-yellow-300 h-full" 
              style={{ width: `${(severityCounts.minor / possiblePairs) * 100}%` }}
              title={`${severityCounts.minor} minor interaction${severityCounts.minor > 1 ? 's' : ''}`}
            />
          )}
          
          {severityCounts.safe > 0 && (
            <div 
              className="bg-green-500 h-full" 
              style={{ width: `${(severityCounts.safe / possiblePairs) * 100}%` }}
              title={`${severityCounts.safe} safe combination${severityCounts.safe > 1 ? 's' : ''}`}
            />
          )}
          
          {severityCounts.unknown > 0 && (
            <div 
              className="bg-gray-300 h-full" 
              style={{ width: `${(severityCounts.unknown / possiblePairs) * 100}%` }}
              title={`${severityCounts.unknown} unknown interaction${severityCounts.unknown > 1 ? 's' : ''}`}
            />
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-sm">
          {severityCounts.severe > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>Severe: {severityCounts.severe}</span>
            </div>
          )}
          
          {severityCounts.moderate > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
              <span>Moderate: {severityCounts.moderate}</span>
            </div>
          )}
          
          {severityCounts.minor > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-300 rounded-sm"></div>
              <span>Minor: {severityCounts.minor}</span>
            </div>
          )}
          
          {severityCounts.safe > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>Safe: {severityCounts.safe}</span>
            </div>
          )}
          
          {severityCounts.unknown > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
              <span>Unknown: {severityCounts.unknown}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
