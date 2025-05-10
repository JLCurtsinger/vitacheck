/**
 * Type definitions for the Medication API
 */

export interface MedicationLookupResult {
  id?: string;
  name: string;
  normalizedName: string;
  source: 'RxNorm' | 'SUPP.AI' | 'Manual' | 'Unknown';
  status: 'active' | 'inactive' | 'unknown';
  warnings?: string[];
}

export interface InteractionSource {
  name: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  confidence?: number;
  url?: string;
  eventData?: any;
  fallbackMode?: boolean;
  fromDatabase?: boolean;
}

export interface AdverseEventData {
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
}

export interface StandardizedApiResponse {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  sources: InteractionSource[];
  confidenceScore?: number;
  aiValidated?: boolean;
}

export interface CombinationResult {
  medications: string[];
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  sources: InteractionSource[];
  confidenceScore?: number;
  type: 'single' | 'pair' | 'triple';
  label: string;
  id?: string;
  adverseEvents?: AdverseEventData;
  aiValidated?: boolean;
  lastUpdated?: Date;
  hoursAgo?: number;
  fromDatabase?: boolean;
  fromCache?: boolean;
  fromExternalApi?: boolean;
}

// Add this to the InteractionResult interface
export interface InteractionResult {
  medications: string[];
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  sources: InteractionSource[];
  confidenceScore?: number;
  id?: string;
  adverseEvents?: AdverseEventData;
  aiValidated?: boolean;
  lastUpdated?: Date;
  hoursAgo?: number;
  fromDatabase?: boolean;
  fromCache?: boolean;
  fromExternalApi?: boolean;
}
