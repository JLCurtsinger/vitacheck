
import { InteractionSource, AdverseEventData } from "@/lib/api/types";

// Extended interface to handle different source-specific data
export interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
}

export interface SourceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: {
    name: string;
    data: SourceData[];
    medications: string[];
  } | null;
}
