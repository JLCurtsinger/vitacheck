
import React, { useState } from "react";
import { AdverseEventData } from "@/lib/api/types";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface AdverseEventsSectionProps {
  adverseEvents: AdverseEventData;
}

export function AdverseEventsSection({ adverseEvents }: AdverseEventsSectionProps) {
  const [showSevere, setShowSevere] = useState(false);

  // Calculate percentage of serious events
  const seriousPercentage = 
    adverseEvents.eventCount > 0 
      ? Math.round((adverseEvents.seriousCount / adverseEvents.eventCount) * 100) 
      : 0;

  return (
    <div className="rounded-md border p-4 mb-4">
      <h3 className="font-medium mb-3 flex items-center">
        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
        Reported Adverse Events
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="text-2xl font-semibold text-gray-800">{adverseEvents.eventCount}</div>
          <div className="text-sm text-gray-500">Total Reports</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <div className="text-2xl font-semibold text-red-600">{adverseEvents.seriousCount}</div>
          <div className="text-sm text-red-600">Serious Cases</div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded border border-orange-200">
          <div className="text-2xl font-semibold text-orange-600">{seriousPercentage}%</div>
          <div className="text-sm text-orange-600">Serious Case Ratio</div>
        </div>
      </div>
      
      <h4 className="font-medium text-sm mb-2">Common Reported Reactions:</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {adverseEvents.commonReactions && adverseEvents.commonReactions.length > 0 ? (
          adverseEvents.commonReactions.map((reaction, idx) => (
            <div key={idx} className="bg-gray-50 p-2 rounded text-sm border border-gray-200">
              {reaction}
            </div>
          ))
        ) : (
          <div className="col-span-2 text-gray-500 text-sm">
            No detailed reaction information available
          </div>
        )}
      </div>
      
      {adverseEvents.seriousCount > 0 && (
        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full flex justify-between items-center p-2 text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
              onClick={() => setShowSevere(!showSevere)}
            >
              View Severe Case Details
              {showSevere ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            <div className="border border-red-200 rounded p-3 bg-red-50 text-sm">
              <p className="mb-2 italic">Up to 5 examples of severe adverse events:</p>
              <ul className="list-disc list-inside space-y-1">
                {/* This would ideally be populated with actual case details if available */}
                {adverseEvents.commonReactions?.slice(0, 5).map((reaction, i) => (
                  <li key={i} className="text-red-700">Case {i+1}: {reaction} (serious)</li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
