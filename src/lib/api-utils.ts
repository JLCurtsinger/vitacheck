
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
  isReliable?: boolean; // Added to indicate if the source data is reliable
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
export interface FDALabelData {
  boxed_warning?: string;
  adverse_reactions?: string;
  contraindications?: string;
  warnings_and_cautions?: string;
  drug_interactions?: string;
}

export interface InteractionResult {
  id?: string;
  medications: string[];
  severity: 'safe' | 'minor' | 'moderate' | 'severe' | 'unknown';
  description: string;
  confidenceScore?: number;
  sources: InteractionSource[];
  evidence?: string;
  adverseEvents?: AdverseEventData;
  fdaLabel?: FDALabelData;
  aiValidated?: boolean;
}

// Export the types and functions
export * from './api/types';

// Export the checkInteractions function
export { checkInteractions } from './api/services/interaction-checker';
