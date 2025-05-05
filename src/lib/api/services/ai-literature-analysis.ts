
/**
 * AI-Powered Medical Literature Analysis
 * 
 * This module provides functionality for cross-validating interaction data
 * using AI models to analyze medical literature when API data is incomplete
 * or conflicting.
 */

import { InteractionSource } from '../types';
import { fetchPubMedIds } from './pubmed/fetch-ids';
import { fetchPubMedAbstracts } from './pubmed/fetch-abstracts';
import { summarizePubMedAbstracts } from './pubmed/summarize-abstracts';

/**
 * Result cache to prevent redundant API calls and ensure consistent results
 * for the same medication pairs.
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
 * Executes a function with timeout protection
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return await Promise.race([promise, timeoutPromise]) as T;
  } catch (error) {
    console.error('Operation timed out or failed:', error);
    return fallbackValue;
  }
}

/**
 * Queries AI to analyze medical literature for interactions
 * between two medications.
 * 
 * Enhanced with PubMed abstract retrieval and summarization.
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
    console.log(`[AI Literature Service] Starting analysis for ${med1} + ${med2}`);
    const startTime = Date.now();
    
    // Check cache first to prevent redundant API calls and ensure consistency
    const cacheKey = getCacheKey(med1, med2);
    if (analysisCache.has(cacheKey)) {
      console.log(`[AI Literature Service] Using cached analysis for ${med1} + ${med2}`);
      return analysisCache.get(cacheKey) || null;
    }
    
    // Attempt to fetch PubMed data first
    console.log(`[AI Literature Service] Attempting to fetch PubMed data for ${med1} and ${med2}`);
    
    // First query: combined search for interaction between both medications
    const combinedQuery = `${med1} ${med2} interaction`;
    let pubMedIds = await withTimeout(
      fetchPubMedIds(combinedQuery), 
      5000,  // 5 second timeout
      []     // Empty array fallback
    );
    
    // If no results, try individual queries for each medication
    if (pubMedIds.length === 0) {
      console.log(`[AI Literature Service] No combined PubMed results, trying individual queries`);
      
      // Try fetching for each medication individually
      const [med1Ids, med2Ids] = await Promise.all([
        withTimeout(fetchPubMedIds(`${med1} interaction`), 3000, []),
        withTimeout(fetchPubMedIds(`${med2} interaction`), 3000, [])
      ]);
      
      // Combine results, taking max 2 from each to avoid overwhelming
      pubMedIds = [...med1Ids.slice(0, 2), ...med2Ids.slice(0, 2)];
    }
    
    // Log PubMed results
    console.log(`[AI Literature Service] Found ${pubMedIds.length} PubMed articles`);
    
    // Variable to store abstract text
    let abstractText = '';
    
    // If we found any PubMed IDs, try to fetch and summarize abstracts
    if (pubMedIds.length > 0) {
      abstractText = await withTimeout(
        fetchPubMedAbstracts(pubMedIds),
        8000,  // 8 second timeout
        ''     // Empty string fallback
      );
      
      console.log(`[AI Literature Service] Retrieved ${abstractText.length} characters of abstract text`);
      
      // If we got abstract text, try to summarize it
      if (abstractText.length > 0) {
        console.log(`[AI Literature Service] Attempting to summarize PubMed abstracts`);
        
        // Create a combined query to capture the interaction context
        const summaryQuery = `${med1} and ${med2} interaction`;
        
        try {
          // Use the Netlify function for summarization
          const summaryResponse = await withTimeout(
            summarizePubMedAbstracts(abstractText, summaryQuery),
            12000,  // 12 second timeout
            ''      // Empty string fallback
          );
          
          if (summaryResponse && summaryResponse.length > 0) {
            console.log(`[AI Literature Service] Successfully summarized PubMed abstracts (${summaryResponse.length} chars)`);
            
            // Extract severity from summary if possible
            let severity: "safe" | "minor" | "moderate" | "severe" | "unknown" = "unknown";
            
            // Check for severity indicators in the text
            if (/serious|severe|significant|dangerous|fatal/i.test(summaryResponse)) {
              severity = "severe";
            } else if (/moderate|significant|notable/i.test(summaryResponse)) {
              severity = "moderate";
            } else if (/mild|minor|slight|minimal/i.test(summaryResponse)) {
              severity = "minor";
            } else if (/safe|no interaction|not interact|no evidence/i.test(summaryResponse)) {
              severity = "safe";
            }
            
            // Create source from summary
            const source: InteractionSource = {
              name: 'AI Literature Analysis',
              severity,
              description: summaryResponse,
              confidence: 70, // Higher confidence when we have actual PubMed data
              pubMedIds,      // Store PubMed IDs for reference
              hasDirectEvidence: true
            };
            
            // Cache the result
            analysisCache.set(cacheKey, source);
            
            const duration = Date.now() - startTime;
            console.log(`[AI Literature Service] Analysis complete in ${duration}ms with PubMed data`);
            
            return source;
          }
        } catch (summaryError) {
          console.error('[AI Literature Service] Error summarizing PubMed abstracts:', summaryError);
          // Continue to fallback (Netlify function)
        }
      }
    }
    
    // If PubMed integration failed, fall back to the Netlify function approach
    console.log(`[AI Literature Service] Using Netlify function for analysis`);
    
    // Use Promise with timeout to prevent long-running requests
    const response = await withTimeout(
      fetch('/.netlify/functions/ai-literature-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          medications: [med1, med2]
        })
      }),
      10000,  // 10 second timeout
      null    // null fallback
    );
    
    if (!response) {
      throw new Error('AI literature analysis request timed out');
    }
    
    if (!response.ok) {
      console.error('[AI Literature Service] API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'error' || !data.result) {
      console.log('[AI Literature Service] Returned error or no result');
      return null;
    }
    
    console.log('[AI Literature Service] Result:', data.result);
    
    const result: InteractionSource = {
      name: 'AI Literature Analysis',
      severity: data.result.severity,
      description: data.result.description,
      confidence: data.result.confidence || 50, // Use provided confidence or default
      hasDirectEvidence: false // Mark as not having direct PubMed evidence
    };
    
    // Cache the result
    analysisCache.set(cacheKey, result);
    
    const duration = Date.now() - startTime;
    console.log(`[AI Literature Service] Analysis complete in ${duration}ms with Netlify function`);
    
    return result;
  } catch (error) {
    console.error('[AI Literature Service] Error:', error);
    return null;
  }
}
