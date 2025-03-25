
import { makeOpenFDARequest, buildOpenFDAUrl } from './api-client';

export interface FDAEventData {
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
    safetyreportid?: string;
    receivedate?: string;
    serious?: string;
    drugcharacterization?: string;
    medicinalproduct?: string;
    reactionmeddrapt?: string[];
  }>;
}

/**
 * Fetches adverse event data from openFDA API
 * @param query - Medication name to search for
 * @returns Object containing adverse event data including reports, total count, and common reactions
 */
export async function fetchAdverseEventData(query: string): Promise<{
  reports: any[];
  total: number;
  commonReactions: string[];
  error?: string;
}> {
  console.log('Fetching adverse event data for:', query);
  
  try {
    const fdaUrl = buildOpenFDAUrl('drug/event', query, 10);
    
    try {
      const data: FDAEventData = await makeOpenFDARequest<FDAEventData>(fdaUrl);
      
      // Extract and structure relevant information
      const structuredResults = data.results?.map(result => ({
        safetyReportId: result.safetyreportid,
        receiveDate: result.receivedate,
        seriousnessDeath: result.serious,
        drugCharacterization: result.drugcharacterization,
        medicinalProduct: result.medicinalproduct,
        reactionMedDRApt: result.reactionmeddrapt
      })) || [];

      // Extract the most common reactions
      let commonReactions: string[] = [];
      if (data.results) {
        const reactionCounts = new Map<string, number>();
        
        data.results.forEach(result => {
          if (result.patient?.reaction) {
            result.patient.reaction.forEach(reaction => {
              if (reaction.reactionmeddrapt) {
                const count = reactionCounts.get(reaction.reactionmeddrapt) || 0;
                reactionCounts.set(reaction.reactionmeddrapt, count + 1);
              }
            });
          }
        });
        
        // Sort by frequency and get top reactions
        commonReactions = Array.from(reactionCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([reaction]) => reaction);
      }

      return {
        reports: structuredResults,
        total: data.meta?.results?.total || 0,
        commonReactions
      };
    } catch (parseError) {
      console.error('Failed to parse openFDA response as JSON:', parseError);
      return {
        reports: [],
        total: 0,
        commonReactions: [],
        error: "Invalid JSON response from openFDA API"
      };
    }
  } catch (error) {
    console.error('Error making request to openFDA API:', error);
    return {
      reports: [],
      total: 0,
      commonReactions: [],
      error: `Error: ${error.message}`
    };
  }
}
