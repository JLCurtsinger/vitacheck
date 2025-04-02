
import React from "react";
import { Book } from "lucide-react";
import { createHTMLProps } from "../../utils/formatDescription";

interface LiteratureSummaryProps {
  bulletPoints: string[];
}

export function LiteratureSummary({ bulletPoints }: LiteratureSummaryProps) {
  return (
    <div className="rounded-md border mb-4 p-4">
      <h3 className="font-medium mb-3 flex items-center">
        <Book className="h-4 w-4 mr-2 text-amber-700" />
        AI Literature Summary
      </h3>
      <div className="space-y-2">
        {bulletPoints.length > 0 ? (
          bulletPoints.map((point, idx) => (
            <p key={idx} className="text-sm" dangerouslySetInnerHTML={createHTMLProps(point)} />
          ))
        ) : (
          <p className="text-sm text-gray-500">No detailed analysis available.</p>
        )}
      </div>
    </div>
  );
}
