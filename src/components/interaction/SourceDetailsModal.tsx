
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSourceColorClass } from "./sourceModal/utils";
import { SourceContentRouter } from "./sourceModal/SourceContentRouter";

// Extended interface to handle different source-specific data
interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface SourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    name: string;
    data: SourceData[];
    medications: string[];
  } | null;
}

export function SourceDetailsModal({ isOpen, onClose, source }: SourceDetailsModalProps) {
  if (!source) return null;
  
  const { name, data, medications } = source;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden shadow-lg border-2">
        <DialogHeader>
          <div className={`rounded-lg px-3 py-1 inline-block ${getSourceColorClass(name)}`}>
            {name}
          </div>
          <DialogTitle className="text-xl mt-2">
            Interaction Details
          </DialogTitle>
          <DialogDescription>
            Information about {medications.join(' + ')} from {name}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(80vh-10rem)] pr-4 pb-4">
          <div className="space-y-4">
            <SourceContentRouter 
              sourceName={name}
              data={data}
              medications={medications}
            />
          </div>
        </ScrollArea>
        
        <DialogFooter className="text-xs text-gray-500 italic mt-4 pt-4 border-t border-gray-100">
          Data from {name} is one of several sources analyzed by VitaCheck's consensus model.
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
