
import React from "react";
import { 
  Dialog, 
  DialogContent
} from "@/components/ui/dialog";
import { InteractionSource, AdverseEventData } from "@/lib/api/types";
import { ModalHeader } from "../sourceModal/ModalHeader";
import { ModalContent } from "../sourceModal/ModalContent";
import { SourceData } from "./types";

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
        <ModalHeader sourceName={name} medications={medications} />
        <ModalContent name={name} data={data} medications={medications} />
      </DialogContent>
    </Dialog>
  );
}
