
/**
 * AI-Powered Medical Literature Analysis
 * 
 * This module provides functionality for cross-validating interaction data
 * using GPT-4o-mini to analyze medical literature when API data is incomplete
 * or conflicting.
 */

import { InteractionSource } from '../types';

/**
 * Result cache to prevent redundant API calls
 */
const analysisCache = new Map<string, InteractionSource>();

/**
 * Generates a cache key for medication pair
 */
function getCacheKey(med1: string, med2: string): string {
  // Sort meds alphabetically for consistent key regardless of order
  return [med1.toLowerCase(), med2.toLowerCase()].sort().join('_');
}

/**
 * Queries GPT-3.5-turbo or GPT-4o-mini to analyze medical literature for interactions
 * between two medications.
 * 
 * @param med1 First medication name
 * @param med2 Second medication name
 * @returns Source object with severity and description, or null if unavailable
 */
export async function queryAiLiteratureAnalysis(
  med1: string,
  med2: string
): Promise<InteractionSource | null> {
  try {
    // Check cache first to prevent redundant API calls
    const cacheKey = getCacheKey(med1, med2);
    if (analysisCache.has(cacheKey)) {
      console.log(`Using cached AI literature analysis for ${med1} + ${med2}`);
      return analysisCache.get(cacheKey) || null;
    }
    
    console.log(`Querying AI literature analysis for ${med1} + ${med2} interaction`);
    
    // Use Promise with timeout to prevent long-running requests
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('AI literature analysis timed out after 10s')), 10000);
    });
    
    const fetchPromise = fetch('/.netlify/functions/ai-literature-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        medications: [med1, med2]
      })
    });
    
    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    if (!response.ok) {
      console.error('AI literature analysis API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'error' || !data.result) {
      console.log('AI literature analysis returned error or no result');
      return null;
    }
    
    console.log('AI literature analysis result:', data.result);
    
    const result: InteractionSource = {
      name: 'AI Literature Analysis',
      severity: data.result.severity,
      description: data.result.description
    };
    
    // Cache the result to prevent redundant API calls
    analysisCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error in AI literature analysis:', error);
    return null;
  }
}
