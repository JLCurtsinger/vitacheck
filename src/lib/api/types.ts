
/**
 * Type definitions for the Medication API
 */

export interface MedicationLookupResult {
  id?: string;
  name: string;
  normalizedName: string;
  source: 'RxNorm' | 'SUPP.AI' | 'Manual' | 'Unknown' | 'FDA';
  status: 'active' | 'inactive' | 'unknown' | 'found' | 'not_found' | 'pending';
  warnings?: string[];
  fallback?: boolean;
  fallbackType?: string;
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
  
  // Additional properties used in components that were missing
  rawData?: any;
  sources?: string[];
  fallbackReason?: string;
  fallbackFields?: string[];
  isReliable?: boolean;
  errorMessage?: string;
  pubMedIds?: string[];
  validationReason?: string;
  timestamp?: string | Date;
  date?: string;
  processed?: boolean;
  tags?: string[];
  hasDirectEvidence?: boolean;
  hasInsight?: boolean;
}

export interface AdverseEventData {
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
  // Additional properties used in components that were missing
  seriousCaseDetails?: string[];
  demographics?: {
    ageGroups?: Record<string, number>;
    genders?: Record<string, number>;
  };
}

export interface StandardizedApiResponse {
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  sources: InteractionSource[];
  confidenceScore?: number;
  aiValidated?: boolean;

  // Add properties that were missing but referenced in the code
  source?: string;
  confidence?: number;
  rawData?: any;
  processed?: boolean;
  eventData?: any;
  fallbackMode?: boolean;
  fallbackReason?: string;
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
