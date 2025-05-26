import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// In-memory cache
const cache: Record<string, { data: UsageStats; expires: number }> = {};

export interface UsageStats {
  users: number;
  claims: number;
  avgSpend: number;
}

export async function getUsageStats(drugName: string): Promise<UsageStats> {
  console.log(`[getUsageStats] Called with drugName: ${drugName}`);
  const key = drugName.toLowerCase();
  
  // 1. Return from memory cache if still valid
  const cached = cache[key];
  if (cached && cached.expires > Date.now()) {
    console.log(`[getUsageStats] Cache hit for ${key}, returning cached data:`, cached.data);
    return cached.data;
  }
  console.log(`[getUsageStats] Cache miss for ${key}, fetching fresh data`);

  // 2. Try live fetch
  try {
    const url = `${process.env.API_BASE_URL}/.netlify/functions/fetchCmsUsage?gnrc_name=${encodeURIComponent(drugName)}`;
    console.log(`[getUsageStats] Fetching from URL: ${url}`);
    
    const resp = await fetch(url);
    console.log(`[getUsageStats] Response status: ${resp.status}`);
    
    const json = await resp.json();
    console.log(`[getUsageStats] Response data:`, json);
    
    if (json.success) {
      const stats: UsageStats = {
        users: json.totals.total_beneficiaries,
        claims: json.totals.total_claims,
        avgSpend: json.totals.average_dosage_spend
      };
      console.log(`[getUsageStats] Parsed stats:`, stats);
      
      // upsert into Supabase
      console.log(`[getUsageStats] Upserting to Supabase for ${key}`);
      await supabase
        .from('usage_cache')
        .upsert({ drug_name: key, ...stats, updated_at: new Date().toISOString() });
      
      // prime memory cache for 10 min
      cache[key] = { data: stats, expires: Date.now() + 10 * 60 * 1000 };
      console.log(`[getUsageStats] Cached stats for ${key}`);
      
      return stats;
    }
    console.log(`[getUsageStats] No success in response, falling back to Supabase`);
    throw new Error('No data');
  } catch (error) {
    console.error(`[getUsageStats] Error in live fetch:`, error);
    
    // 3. Fallback to Supabase
    console.log(`[getUsageStats] Fetching from Supabase for ${key}`);
    const { data } = await supabase
      .from('usage_cache')
      .select('users,claims,avg_spend')
      .eq('drug_name', key)
      .single();
    
    if (data) {
      console.log(`[getUsageStats] Found Supabase data:`, data);
      const stats: UsageStats = {
        users: data.users,
        claims: data.claims,
        avgSpend: data.avg_spend
      };
      cache[key] = { data: stats, expires: Date.now() + 10 * 60 * 1000 };
      return stats;
    }
    
    // 4. Last resort: return zeros
    console.log(`[getUsageStats] No data found anywhere, returning zeros`);
    return { users: 0, claims: 0, avgSpend: 0 };
  }
} 