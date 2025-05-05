
import React from "react";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getSourceColorClass } from "../sourceModal/utils";

interface ModalHeaderProps {
  sourceName: string;
  medications: string[];
}

export function ModalHeader({ sourceName, medications }: ModalHeaderProps) {
  return (
    <DialogHeader>
      <div className={`rounded-lg px-3 py-1 inline-block ${getSourceColorClass(sourceName)}`}>
        {sourceName}
      </div>
      <DialogTitle className="text-xl mt-2">
        Interaction Details
      </DialogTitle>
      <DialogDescription>
        Information about {medications.join(' + ')} from {sourceName}
      </DialogDescription>
    </DialogHeader>
  );
}
