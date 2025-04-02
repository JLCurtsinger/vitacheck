
import { ScrollArea } from "@/components/ui/scroll-area";
import { DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getSourceColorClass } from "./utils";
import { SourceContentRouter } from "./SourceContentRouter";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { useState } from "react";

// Extended interface to handle different source-specific data
interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

interface ModalContentProps {
  name: string;
  data: SourceData[];
  medications: string[];
}

export function ModalContent({ name, data, medications }: ModalContentProps) {
  // State for clinician view toggle
  const [clinicianView, setClinicianView] = useState(false);

  return (
    <>
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
    </>
  );
}
