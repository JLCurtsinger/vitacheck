
export interface MedicationLookupResult {
  found: boolean;
  source?: 'RxNorm' | 'SUPP.AI' | 'FDA';
  id?: string;
  warnings?: string[];
}

export interface InteractionSource {
  name: string;
  severity: "safe" | "minor" | "severe" | "unknown";
  description?: string;
}

export interface AdverseEventData {
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
}

export interface InteractionResult {
  id?: string; // Adding optional id property for interaction identification
  medications: [string, string];
  severity: "safe" | "minor" | "severe" | "unknown";
  description: string;
  evidence?: string;
  sources: InteractionSource[];
  adverseEvents?: AdverseEventData;
}
