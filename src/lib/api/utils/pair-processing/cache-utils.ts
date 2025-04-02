
/**
 * Interaction Caching Utilities
 * 
 * This module provides caching functionality for interaction results 
 * to improve performance and ensure consistent results.
 */

import { InteractionResult } from '../../types';

// Cache for medication pair processing to ensure consistent results
const pairProcessingCache = new Map<string, InteractionResult>();

/**
 * Get a unique key for caching medication pair results
 */
export function getPairCacheKey(med1: string, med2: string): string {
  // Sort medications for consistent key regardless of order
  return [med1.toLowerCase(), med2.toLowerCase()].sort().join('|');
}

/**
 * Store an interaction result in the cache
 */
export function cacheInteractionResult(
  med1: string, 
  med2: string, 
  result: InteractionResult
): void {
  const cacheKey = getPairCacheKey(med1, med2);
  pairProcessingCache.set(cacheKey, result);
}

/**
 * Retrieve an interaction result from the cache if available
 */
export function getCachedInteractionResult(
  med1: string, 
  med2: string
): InteractionResult | undefined {
  const cacheKey = getPairCacheKey(med1, med2);
  return pairProcessingCache.get(cacheKey);
}

/**
 * Check if a result exists in the cache
 */
export function hasInteractionCache(med1: string, med2: string): boolean {
  const cacheKey = getPairCacheKey(med1, med2);
  return pairProcessingCache.has(cacheKey);
}
