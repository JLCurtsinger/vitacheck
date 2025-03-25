
/**
 * OpenFDA Adverse Event API Integration
 * 
 * This module handles interactions with the OpenFDA Adverse Event API
 * to fetch real-world reported adverse events for medication combinations.
 */

export interface AdverseEventResponse {
  meta?: {
    results?: {
      total: number;
    };
  };
  results?: Array<{
    patient?: {
      reaction?: Array<{
        reactionmeddrapt?: string;
      }>;
    };
    serious?: string;
  }>;
  error?: {
    message?: string;
    code?: string;
  };
}

// Session-level cache for adverse events
const adverseEventsCache = new Map<string, {
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
} | null>();

// Helper function to generate a consistent cache key
function getCacheKey(med1: string, med2: string): string {
  return [med1.toLowerCase(), med2.toLowerCase()].sort().join('+');
}

/**
 * Fetches adverse event data for a combination of medications
 * 
 * @param med1 - First medication name
 * @param med2 - Second medication name
 * @returns Object containing adverse event data or null if no data found
 */
export async function getAdverseEvents(med1: string, med2: string): Promise<{
  eventCount: number;
  seriousCount: number;
  commonReactions: string[];
} | null> {
  try {
    // Check cache first
    const cacheKey = getCacheKey(med1, med2);
    if (adverseEventsCache.has(cacheKey)) {
      console.log(`🔍 [OpenFDA Events] Using cached adverse events for: ${med1} + ${med2}`);
      return adverseEventsCache.get(cacheKey);
    }
    
    // Encode medication names for the API request
    const encodedMed1 = encodeURIComponent(med1.trim());
    const encodedMed2 = encodeURIComponent(med2.trim());
    
    // Construct the search query using both generic and brand name fields for better matches
    const searchQuery = `(patient.drug.openfda.generic_name:"${encodedMed1}"+OR+patient.drug.openfda.brand_name:"${encodedMed1}")+AND+(patient.drug.openfda.generic_name:"${encodedMed2}"+OR+patient.drug.openfda.brand_name:"${encodedMed2}")`;
    
    // Build the API URL
    const url = `https://api.fda.gov/drug/event.json?search=${searchQuery}&limit=10`;
    console.log(`🔍 [OpenFDA Events] Querying adverse events for: ${med1} + ${med2}`);
    console.log(`🔍 [OpenFDA Events] URL: ${url}`);
    
    // Execute the API request
    const response = await fetch(url);
    
    // Handle API errors
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`✅ [OpenFDA Events] No adverse events found for: ${med1} + ${med2}`);
        adverseEventsCache.set(cacheKey, null);
        return null;
      }
      
      console.error(`❌ [OpenFDA Events] API error (${response.status}): ${response.statusText}`);
      return null;
    }
    
    // Parse the API response
    const data: AdverseEventResponse = await response.json();
    
    // Check if we have valid results
    if (!data.results || data.results.length === 0) {
      console.log(`✅ [OpenFDA Events] No adverse events found for: ${med1} + ${med2}`);
      adverseEventsCache.set(cacheKey, null);
      return null;
    }
    
    // Process the response data
    const eventCount = data.meta?.results?.total || data.results.length;
    let seriousCount = 0;
    const reactions = new Map<string, number>();
    
    // Extract serious events and reactions
    data.results.forEach(result => {
      if (result.serious === '1') {
        seriousCount++;
      }
      
      result.patient?.reaction?.forEach(reaction => {
        if (reaction.reactionmeddrapt) {
          const count = reactions.get(reaction.reactionmeddrapt) || 0;
          reactions.set(reaction.reactionmeddrapt, count + 1);
        }
      });
    });
    
    // Sort reactions by frequency and get the top ones
    const sortedReactions = Array.from(reactions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reaction]) => reaction);
    
    console.log(`✅ [OpenFDA Events] Found ${eventCount} events (${seriousCount} serious) for: ${med1} + ${med2}`);
    console.log(`✅ [OpenFDA Events] Common reactions:`, sortedReactions);
    
    const result = {
      eventCount,
      seriousCount,
      commonReactions: sortedReactions
    };
    
    // Cache the result
    adverseEventsCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error(`❌ [OpenFDA Events] Error fetching adverse events:`, error);
    return null;
  }
}
