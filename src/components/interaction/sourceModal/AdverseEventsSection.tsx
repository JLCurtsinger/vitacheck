
import React from "react";
import { AdverseEventData } from "@/lib/api/types";

interface AdverseEventsSectionProps {
  adverseEvents: AdverseEventData;
}

export function AdverseEventsSection({ adverseEvents }: AdverseEventsSectionProps) {
  return (
    <div className="rounded-md border p-4 mb-4">
      <h3 className="font-medium mb-2">Reported Adverse Events</h3>
      <p className="text-sm mb-2">Total events: {adverseEvents.eventCount}</p>
      <div className="grid grid-cols-2 gap-2">
        {adverseEvents.commonReactions && adverseEvents.commonReactions.length > 0 ? (
          adverseEvents.commonReactions.slice(0, 8).map((reaction, idx) => (
            <div key={idx} className="bg-gray-50 p-2 rounded text-sm">
              {reaction}
            </div>
          ))
        ) : (
          <div className="col-span-2 text-gray-500 text-sm">
            No detailed event information available
          </div>
        )}
      </div>
    </div>
  );
}
