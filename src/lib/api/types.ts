/**
 * API Types
 * 
 * This file contains type definitions for all API-related data structures
 */

import { UsageStats } from '@/services/usage';

/**
 * Represents the status and ID information for a medication lookup
 */
export interface MedicationLookupResult {
  id?: string;
  name: string;
  source: "RxNorm" | "SUPP.AI" | "FDA" | "Manual" | "Unknown";
  status: "found" | "not_found" | "pending" | "active" | "inactive" | "unknown";
  found?: boolean; // Added for backward compatibility
  warnings?: string[];
  fallback?: boolean; // Indicates if a fallback mechanism was used
  fallbackType?: 'local_cache' | 'alternative_format' | 'fda' | 'suppai'; // Type of fallback used
  usageData?: UsageStats; // CMS usage statistics
}

/**
 * Raw API response data structure
 */
export interface RawApiResponse {
  status?: string;
  data?: Record<string, unknown>;
  error?: string;
  details?: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Standardized API response format to ensure consistent structure
 * before risk scoring and ML prediction
 */
export interface StandardizedApiResponse {
  sources: InteractionSource[];
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown" | null;
  description: string;
  confidence?: number;
  rawData: RawApiResponse;
  processed: boolean;
  eventData?: {
    totalEvents: number;
    seriousEvents: number;
    nonSeriousEvents: number;
    seriousPercentage?: number;
    commonReactions?: string[];
  };
  fallbackMode?: boolean; // Flag to indicate if fallback processing was used
  fallbackReason?: string; // Reason for using fallback processing
  // Adding source field for backward compatibility with existing code
  source?: string;
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
  sourceUrl?: string; // URL to the source material
  eventData?: {
    totalEvents: number;
    seriousEvents: number;
    nonSeriousEvents: number;
    seriousPercentage?: number; // Add this property for tracking percentage of serious events
    commonReactions?: string[]; // Add this property for storing common reactions
  };
  // Adding additional metadata fields for source modals
  rawData?: any; // Raw data from the API
  timestamp?: string; // Timestamp when the data was retrieved
  date?: string; // Date when the data was retrieved
  tags?: string[]; // Tags associated with the data
  processed?: boolean; // Whether the data has been processed
  fallbackMode?: boolean; // Flag to indicate if fallback processing was used
  fallbackReason?: string; // Description of fallback processing applied
  fallbackFields?: string[]; // Fields that were populated using fallback logic
  sources?: string[]; // References to source material
  validationReason?: string; // Why a source was considered valid or invalid
  errorMessage?: string; // Error message if processing failed
  hasInsight?: boolean; // Whether the source provides meaningful insight
  pubMedIds?: string[]; // PubMed article IDs related to this interaction
  hasDirectEvidence?: boolean; // Indicates whether there is direct evidence from PubMed
}

/**
 * Represents data about adverse events for a medication combination
 */
export interface AdverseEventData {
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
  seriousCaseDetails?: string[]; // Added for specific details about serious cases
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

export interface FDALabelData {
  description?: string;
  boxed_warning?: string;
  adverse_reactions?: string;
  contraindications?: string;
  warnings_and_cautions?: string;
  drug_interactions?: string;
}
