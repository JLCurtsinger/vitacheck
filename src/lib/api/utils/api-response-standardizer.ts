
/**
 * API Response Standardizer
 * 
 * Utility functions to standardize various API responses into a consistent format
 * before risk scoring and ML prediction.
 */

import { StandardizedApiResponse, InteractionSource } from '../types';

/**
 * Standardizes an API response into a consistent format
 */
export function standardizeApiResponse(
  sourceName: string,
  rawData: any,
  description: string = "No description available"
): StandardizedApiResponse {
  return {
    sources: [], // Initialize with empty array
    severity: null, // Will be assigned by scoring or ML
    description,
    confidence: undefined,
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
  // Ensure we have sources array
  const sources = response.sources || [];
  
  return {
    sources,
    severity: response.severity || null,
    description: response.description || "No description available",
    confidence: response.confidence,
    rawData: response.rawData || {},
    processed: response.processed || false,
    eventData: response.eventData,
    fallbackMode: response.fallbackMode,
    fallbackReason: response.fallbackReason
  };
}

/**
 * Converts a standardized response to an InteractionSource
 * after processing and scoring
 */
export function standardizedResponseToSource(
  response: StandardizedApiResponse
): InteractionSource {
  // Ensure we have a valid severity
  const severity = response.severity || "unknown";
  
  return {
    name: response.sources && response.sources.length > 0 ? response.sources[0].name : "Unknown Source",
    severity: severity as "safe" | "minor" | "moderate" | "severe" | "unknown",
    description: response.description,
    confidence: response.confidence,
    eventData: response.eventData
  };
}
