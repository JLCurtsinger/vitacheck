
import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdverseEventData } from "@/lib/api-utils";

interface AdverseEventsProps {
  adverseEvents: AdverseEventData;
}

export function AdverseEvents({ adverseEvents }: AdverseEventsProps) {
  const [showAdverseEvents, setShowAdverseEvents] = useState(false);
  
  if (!adverseEvents || adverseEvents.eventCount === 0) return null;
  
  const hasSeriousEvents = adverseEvents.seriousCount > 0;
  
  return (
    <div className={cn(
      "mt-4 p-4 rounded-lg border",
      hasSeriousEvents 
        ? "bg-red-50/60 border-red-200" 
        : "bg-yellow-50/60 border-yellow-200"
    )}>
      <h3 className={cn(
        "text-base font-semibold flex items-center gap-2 mb-3 pb-2 border-b",
        hasSeriousEvents
          ? "text-red-700 border-red-200" 
          : "text-yellow-700 border-yellow-200"
      )}>
        <FileText className="h-4 w-4" />
        📝 Real-World Reports from FDA Adverse Events
      </h3>
      
      <div className="font-medium mb-3">
        {hasSeriousEvents
          ? "⚠️ Real-world data shows serious adverse events reported for this combination. Consult a doctor before use."
          : "⚠️ Real-world reports suggest potential adverse reactions when combining these medications."}
      </div>
      
      <div className="text-sm mb-2">
        <span className="font-medium">Report Summary:</span> {adverseEvents.eventCount} total reports
        {hasSeriousEvents && 
          `, including ${adverseEvents.seriousCount} serious cases`
        }
      </div>
      
      {showAdverseEvents ? (
        <div className="mt-3 space-y-1">
          <div className="font-medium mb-1">Common reported reactions:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {adverseEvents.commonReactions.map((reaction, index) => (
              <li key={index} className={cn(
                hasSeriousEvents
                  ? "text-red-800" 
                  : "text-yellow-800"
              )}>
                {reaction}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowAdverseEvents(!showAdverseEvents)}
        className={cn(
          "w-full mt-3",
          hasSeriousEvents
            ? "bg-white text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" 
            : "bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700"
        )}
      >
        {showAdverseEvents ? (
          <>Hide Details <ChevronUp className="h-4 w-4" /></>
        ) : (
          <>View Adverse Event Details <ChevronDown className="h-4 w-4" /></>
        )}
      </Button>
    </div>
  );
}
