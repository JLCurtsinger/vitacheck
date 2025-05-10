
import React, { useState } from "react";
import { AdverseEventData } from "@/lib/api/types";
import { AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface AdverseEventsSectionProps {
  adverseEvents: AdverseEventData;
  clinicianView?: boolean;
  showFallbackNotice?: boolean;
}

export function AdverseEventsSection({ 
  adverseEvents, 
  clinicianView = false,
  showFallbackNotice = false 
}: AdverseEventsSectionProps) {
  const [showSevere, setShowSevere] = useState(false);

  // Calculate percentage of serious events with 1 decimal place
  const seriousPercentage = 
    adverseEvents.eventCount > 0 
      ? ((adverseEvents.seriousCount / adverseEvents.eventCount) * 100).toFixed(1)
      : "0.0";

  // Check if we have specific serious case details
  const hasSeriousCaseDetails = adverseEvents.seriousCaseDetails && 
    Array.isArray(adverseEvents.seriousCaseDetails) && 
    adverseEvents.seriousCaseDetails.length > 0;

  return (
    <div className="rounded-md border p-4 mb-4">
      <h3 className="font-medium mb-3 flex items-center">
        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
        Reported Adverse Events
      </h3>
      
      {showFallbackNotice && clinicianView && (
        <div className="bg-amber-50 border border-amber-200 p-2 mb-3 text-xs text-amber-700 rounded">
          Note: This data was processed using fallback logic due to schema variations.
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded border border-gray-200">
          <div className="text-2xl font-semibold text-gray-800">{adverseEvents.eventCount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Reports</div>
        </div>
        
        <div className="bg-red-50 p-3 rounded border border-red-200">
          <div className="text-2xl font-semibold text-red-600">{adverseEvents.seriousCount.toLocaleString()}</div>
          <div className="text-sm text-red-600">Serious Cases</div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded border border-orange-200">
          <div className="text-2xl font-semibold text-orange-600">{seriousPercentage}%</div>
          <div className="text-sm text-orange-600">Serious Case Ratio</div>
        </div>
      </div>
      
      {/* Common Reactions Section - Clearly labeled */}
      {adverseEvents.commonReactions && adverseEvents.commonReactions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <Info className="h-4 w-4 text-blue-500 mr-1" />
            Commonly Reported Reactions (any severity):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {adverseEvents.commonReactions.map((reaction, idx) => (
              <div key={idx} className="bg-gray-50 p-2 rounded text-sm border border-gray-200">
                {reaction}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Serious Cases Section - Only if we have serious cases */}
      {adverseEvents.seriousCount > 0 && (
        <Collapsible className="w-full">
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className={`w-full flex justify-between items-center p-2 ${
                hasSeriousCaseDetails 
                  ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100" 
                  : "text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
              onClick={() => setShowSevere(!showSevere)}
            >
              View Severe Case Details
              {showSevere ? <ChevronDown className="h-4 w-4 ml-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-2">
            <div className="border border-gray-200 rounded p-3 bg-gray-50 text-sm">
              {hasSeriousCaseDetails ? (
                <>
                  <p className="mb-2 italic">Examples of serious adverse events:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {adverseEvents.seriousCaseDetails.slice(0, 5).map((caseDetail, i) => (
                      <li key={i} className="text-red-700">{caseDetail}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-700">
                  {adverseEvents.seriousCount} serious cases were reported, but no specific reaction details are available for these cases.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {/* Demographics Section - If Available */}
      {adverseEvents.demographics && (
        <div className="mt-4 border rounded-md p-3 bg-blue-50 border-blue-100">
          <h4 className="font-medium text-sm mb-2">Patient Demographics:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adverseEvents.demographics.ageGroups && Object.keys(adverseEvents.demographics.ageGroups).length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-600 mb-1">Age Groups:</h5>
                <div className="space-y-1">
                  {Object.entries(adverseEvents.demographics.ageGroups).map(([age, count], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{age}:</span>
                      <Badge variant="outline" className="ml-2">{String(count)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {adverseEvents.demographics.genders && Object.keys(adverseEvents.demographics.genders).length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-600 mb-1">Gender Distribution:</h5>
                <div className="space-y-1">
                  {Object.entries(adverseEvents.demographics.genders).map(([gender, count], i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span>{gender}:</span>
                      <Badge variant="outline" className="ml-2">{String(count)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
