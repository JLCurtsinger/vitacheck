
import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  // State for clinician view toggle
  const [clinicianView, setClinicianView] = useState(false);

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
        
        {/* Clinician View Toggle - Made sticky */}
        <div className="flex items-center justify-end space-x-2 mb-4 sticky top-0 bg-white p-2 z-10 rounded-md border border-gray-100 shadow-sm">
          <Label htmlFor="clinician-view" className="text-sm font-medium">
            Clinician View
          </Label>
          <Switch
            id="clinician-view"
            checked={clinicianView}
            onCheckedChange={setClinicianView}
          />
        </div>
        
        <ScrollArea className="max-h-[calc(80vh-12rem)] pr-4 pb-4">
          <div className="space-y-4">
            <SourceContentRouter 
              sourceName={name}
              data={data}
              medications={medications}
              clinicianView={clinicianView}
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
