
/**
 * API Response Standardizer
 * 
 * Utility functions to standardize various API responses into a consistent format
 * before risk scoring and ML prediction.
 */

import { StandardizedApiResponse } from '../types';

/**
 * Standardizes an API response into a consistent format
 */
export function standardizeApiResponse(
  source: string,
  rawData: any,
  description: string = "No description available"
): StandardizedApiResponse {
  return {
    source,
    severity: null, // Will be assigned by scoring or ML
    description,
    confidence: null,
    rawData,
    processed: false
  };
}

/**
 * Safely extracts event data from adverse event responses
 */
export function extractEventData(adverseEvents: any): StandardizedApiResponse['eventData'] | undefined {
  if (!adverseEvents) return undefined;
  
  try {
    const totalEvents = adverseEvents.eventCount || 0;
    const seriousEvents = adverseEvents.seriousCount || 0;
    const nonSeriousEvents = totalEvents - seriousEvents;
    const seriousPercentage = totalEvents > 0 ? (seriousEvents / totalEvents) * 100 : 0;
    
    return {
      totalEvents,
      seriousEvents,
      nonSeriousEvents,
      seriousPercentage,
      commonReactions: adverseEvents.commonReactions || []
    };
  } catch (error) {
    console.error('Error extracting event data:', error);
    return undefined;
  }
}

/**
 * Validates a standardized response to ensure it has all required fields
 * and defaults missing values
 */
export function validateStandardizedResponse(
  response: Partial<StandardizedApiResponse>
): StandardizedApiResponse {
  return {
    source: response.source || "Unknown",
    severity: response.severity || null,
    description: response.description || "No description available",
    confidence: response.confidence || null,
    rawData: response.rawData || {},
    processed: response.processed || false,
    eventData: response.eventData
  };
}

/**
 * Converts a standardized response to an InteractionSource
 * after processing and scoring
 */
export function standardizedResponseToSource(
  response: StandardizedApiResponse
): {
  name: string;
  severity: "safe" | "minor" | "moderate" | "severe" | "unknown";
  description: string;
  confidence?: number;
  eventData?: StandardizedApiResponse['eventData'];
} {
  // Ensure we have a valid severity
  const severity = response.severity || "unknown";
  
  return {
    name: response.source,
    severity: severity as "safe" | "minor" | "moderate" | "severe" | "unknown",
    description: response.description,
    confidence: response.confidence,
    eventData: response.eventData
  };
}
