
import React from "react";
import { 
  Dialog, 
  DialogContent
} from "@/components/ui/dialog";
import { ModalHeader } from "./ModalHeader";
import { ModalContent } from "./ModalContent";
import { SourceDetailsModalProps } from "./types";

export function SourceDetailsModal({ isOpen, onClose, source }: SourceDetailsModalProps) {
  if (!source) return null;
  
  const { name, data, medications } = source;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden shadow-lg border-2">
        <ModalHeader sourceName={name} medications={medications} />
        <ModalContent name={name} data={data} medications={medications} />
      </DialogContent>
    </Dialog>
  );
}
