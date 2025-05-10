
import { InteractionSource, AdverseEventData } from "@/lib/api/types";

// Extended interface to handle different source-specific data
export interface SourceData extends InteractionSource {
  adverseEvents?: AdverseEventData;
  fallbackReason?: string;
  fallbackMode?: boolean;
}
