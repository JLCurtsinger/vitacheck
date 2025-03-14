
/**
 * AI-Powered Medical Literature Analysis
 * 
 * This module provides functionality for cross-validating interaction data
 * using GPT-o3-mini to analyze medical literature when API data is incomplete
 * or conflicting.
 */

import { InteractionSource } from '../types';

/**
 * Queries GPT-o3-mini to analyze medical literature for interactions
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
    console.log(`Querying AI literature analysis for ${med1} + ${med2} interaction`);
    
    const response = await fetch('/.netlify/functions/ai-literature-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        medications: [med1, med2]
      })
    });
    
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
    
    return {
      name: 'AI Literature Analysis',
      severity: data.result.severity,
      description: data.result.description
    };
  } catch (error) {
    console.error('Error in AI literature analysis:', error);
    return null;
  }
}
