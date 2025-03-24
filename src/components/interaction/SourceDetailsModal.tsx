
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
import { SourceContentRouter } from "./sourceModal/SourceContentRouter";

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
            <SourceContentRouter 
              sourceName={name}
              data={data}
              medications={medications}
            />
            
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
