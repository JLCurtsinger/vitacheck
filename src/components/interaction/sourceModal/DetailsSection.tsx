
import React, { useState } from "react";
import { InteractionSource } from "@/lib/api/types";
import { Code, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DetailsSectionProps {
  data: InteractionSource[];
  showRaw?: boolean;
}

export function DetailsSection({ data, showRaw = false }: DetailsSectionProps) {
  const [showRawData, setShowRawData] = useState(showRaw);

  return (
    <div className="rounded-md border mb-4 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium flex items-center">
          <Info className="h-4 w-4 mr-2 text-gray-500" />
          Details
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          className="text-xs"
          onClick={() => setShowRawData(!showRawData)}
        >
          <Code className="h-3 w-3 mr-1" />
          {showRawData ? "Hide Raw Data" : "Show Raw Data"}
        </Button>
      </div>
      
      {!showRawData ? (
        <div className="text-sm text-gray-700 max-h-60 overflow-y-auto">
          {data.map((item, idx) => (
            <p key={idx} className="mb-2">
              {item.description || "No detailed description available"}
            </p>
          ))}
        </div>
      ) : (
        <Collapsible className="w-full" defaultOpen={true}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 text-xs">
              Raw Source Data
              <Code className="h-3 w-3 ml-1" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-60">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
