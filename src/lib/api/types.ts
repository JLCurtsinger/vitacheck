
/**
 * API Types
 * 
 * This file contains type definitions for all API-related data structures
 */

/**
 * Represents the status and ID information for a medication lookup
 */
export interface MedicationLookupResult {
  id?: string;
  name: string;
  source: string;
  status: "found" | "not_found" | "pending";
  found?: boolean; // Added for backward compatibility
  warnings?: string[];
}

/**
 * Represents a source of information about a medication interaction
 */
export interface InteractionSource {
  name: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  confidence?: number; // Added confidence rating for each source
  eventData?: {
    totalEvents: number;
    seriousEvents: number;
    nonSeriousEvents: number;
    seriousPercentage?: number; // Add this property for tracking percentage of serious events
    commonReactions?: string[]; // Add this property for storing common reactions
  };
}

/**
 * Represents data about adverse events for a medication combination
 */
export interface AdverseEventData {
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
  demographics?: {
    ageGroups?: Record<string, number>;
    genders?: Record<string, number>;
  };
}

/**
 * Represents the result of a medication interaction check
 */
export interface InteractionResult {
  id?: string;
  medications: string[];
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  evidence?: string; // Added for backward compatibility
  sources: InteractionSource[];
  adverseEvents?: AdverseEventData;
  confidenceScore?: number; // Added overall confidence score
  aiValidated?: boolean; // Indicates if AI was used to validate
}
