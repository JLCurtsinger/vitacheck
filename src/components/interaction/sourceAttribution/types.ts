
import { InteractionResult } from "@/lib/api/types";

export interface SourceAttributionProps {
  sources: string[];
  interaction?: InteractionResult;
}

export interface SourceModalData {
  name: string;
  data: any[];
  medications: string[];
}
