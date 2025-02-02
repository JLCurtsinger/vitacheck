export interface MedicationLookupResult {
  found: boolean;
  source?: 'RxNorm' | 'SUPP.AI' | 'FDA';
  id?: string;
  warnings?: string[];
}

export interface InteractionResult {
  medications: [string, string];
  severity: "safe" | "minor" | "severe" | "unknown";
  description: string;
  evidence?: string;
  sources: string[];
}