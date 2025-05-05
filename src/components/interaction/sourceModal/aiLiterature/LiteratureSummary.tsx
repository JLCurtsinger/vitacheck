
import React from "react";
import { Book } from "lucide-react";
import { createHTMLProps } from "../../utils/formatDescription";

interface LiteratureSummaryProps {
  bulletPoints: string[];
  sourcesReferenced?: string[];
  reliability?: {
    isReliable: boolean;
    reason?: string;
    hasPubMedEvidence?: boolean;
  };
  isFallback?: boolean;
}

export function LiteratureSummary({ 
  bulletPoints, 
  sourcesReferenced,
  reliability,
  isFallback = false
}: LiteratureSummaryProps) {
  return (
    <div className="rounded-md border mb-4 p-4">
      <h3 className="font-medium mb-3 flex items-center">
        <Book className="h-4 w-4 mr-2 text-amber-700" />
        {isFallback ? 'Analysis Summary' : 'AI Literature Summary'}
      </h3>
      
      {reliability && !reliability.isReliable && (
        <div className="bg-amber-50 p-2 rounded-md mb-3 text-xs text-amber-800">
          <p>
            <strong>Note:</strong> This analysis has {reliability.reason ? `limited reliability: ${reliability.reason}` : 'limited reliability'}.
            Please consider other sources.
          </p>
        </div>
      )}
      
      {isFallback && (
        <div className="bg-blue-50 p-2 rounded-md mb-3 text-xs text-blue-800">
          <p>
            <strong>Note:</strong> This summary was generated from available data sources as specific literature analysis could not be retrieved.
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        {bulletPoints.length > 0 ? (
          bulletPoints.map((point, idx) => (
            <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
          ))
        ) : (
          <p className="text-sm text-gray-500">No detailed analysis available.</p>
        )}
      </div>
      
      {sourcesReferenced && sourcesReferenced.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <strong>Analysis references:</strong> {sourcesReferenced.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
