/**
 * Safe CMS Usage Data Fetcher
 * 
 * This module provides a safe way to fetch CMS Medicare usage data
 * without relying on Supabase or other server-side dependencies.
 * It's designed for use in client-side components like modals.
 */

export interface UsageStats {
  users: number;
  claims: number;
  avgSpend: number;
}

/**
 * Fetches CMS usage data directly from the Netlify function
 * without any Supabase dependencies
 */
export async function getCmsUsageStats(drugName: string): Promise<UsageStats | null> {
  if (!drugName?.trim()) {
    console.warn('[getCmsUsageStats] No drug name provided');
    return null;
  }

  try {
    const url = `/.netlify/functions/fetchCmsUsage?gnrc_name=${encodeURIComponent(drugName.trim())}`;
    console.log(`[getCmsUsageStats] Fetching from URL: ${url}`);
    
    const resp = await fetch(url);
    console.log(`[getCmsUsageStats] Response status: ${resp.status}`);
    
    const json = await resp.json();
    console.log(`[getCmsUsageStats] Raw response:`, json);
    
    if (json?.success && json?.totals) {
      const stats: UsageStats = {
        users: json.totals.total_beneficiaries || 0,
        claims: json.totals.total_claims || 0,
        avgSpend: json.totals.average_dosage_spend || 0
      };
      console.log(`[getCmsUsageStats] Parsed stats for ${drugName}:`, stats);
      return stats;
    }

    console.warn(`[getCmsUsageStats] No valid totals found in CMS response for ${drugName}`, json);
    return null;
  } catch (err) {
    console.error(`[getCmsUsageStats] Failed to fetch CMS data for ${drugName}:`, err);
    return null;
  }
} 