
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSourceColorClass } from "./sourceModal/utils";
import { AdverseEventsSourceContent } from "./sourceModal/AdverseEventsSourceContent";
import { FDASourceContent } from "./sourceModal/FDASourceContent";
import { AILiteratureSourceContent } from "./sourceModal/AILiteratureSourceContent";
import { DefaultSourceContent } from "./sourceModal/DefaultSourceContent";

// We need to define a custom type to handle the special case for adverse events
interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface SourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    name: string;
    data: SourceData[]; // Updated type to our custom interface
    medications: string[];
  } | null;
}

export function SourceDetailsModal({ isOpen, onClose, source }: SourceDetailsModalProps) {
  if (!source) return null;
  
  const { name, data, medications } = source;
  
  // Determine which content to render based on the source name
  const renderSourceContent = () => {
    if (data.length === 0) {
      return (
        <div className="p-6 text-center">
          <p className="text-gray-600">No detailed information available for this source.</p>
        </div>
      );
    }
    
    if (name.toUpperCase().includes("ADVERSE")) {
      return <AdverseEventsSourceContent data={data} />;
    } else if (name.toUpperCase().includes("FDA")) {
      return <FDASourceContent data={data} medications={medications} />;
    } else if (name.toUpperCase().includes("AI") || name.toUpperCase().includes("LITERATURE")) {
      return <AILiteratureSourceContent data={data} medications={medications} />;
    }
    
    return <DefaultSourceContent data={data} />;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className={`rounded-lg px-3 py-1 inline-block ${getSourceColorClass(name)}`}>
            {name} Data Source
          </div>
          <DialogTitle className="text-xl mt-2">
            Interaction Details from {name}
          </DialogTitle>
          <DialogDescription>
            Information about {medications.join(' + ')} interaction from {name} database
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-10rem)] pr-4">
          <div className="space-y-4 pb-4">
            {renderSourceContent()}
            
            <div className="text-sm text-gray-500 italic">
              Note: This data is sourced directly from the {name} database and represents 
              their assessment of this interaction.
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
