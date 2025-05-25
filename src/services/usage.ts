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
  const key = drugName.toLowerCase();
  // 1. Return from memory cache if still valid
  const cached = cache[key];
  if (cached && cached.expires > Date.now()) return cached.data;

  // 2. Try live fetch
  try {
    const resp = await fetch(
      `${process.env.API_BASE_URL}/.netlify/functions/fetchCmsUsage?gnrc_name=${encodeURIComponent(drugName)}`
    );
    const json = await resp.json();
    if (json.success) {
      const stats: UsageStats = {
        users: json.totals.total_beneficiaries,
        claims: json.totals.total_claims,
        avgSpend: json.totals.average_dosage_spend
      };
      // upsert into Supabase
      await supabase
        .from('usage_cache')
        .upsert({ drug_name: key, ...stats, updated_at: new Date().toISOString() });
      // prime memory cache for 10 min
      cache[key] = { data: stats, expires: Date.now() + 10 * 60 * 1000 };
      return stats;
    }
    throw new Error('No data');
  } catch {
    // 3. Fallback to Supabase
    const { data } = await supabase
      .from('usage_cache')
      .select('users,claims,avg_spend')
      .eq('drug_name', key)
      .single();
    if (data) {
      const stats: UsageStats = {
        users: data.users,
        claims: data.claims,
        avgSpend: data.avg_spend
      };
      cache[key] = { data: stats, expires: Date.now() + 10 * 60 * 1000 };
      return stats;
    }
    // 4. Last resort: return zeros
    return { users: 0, claims: 0, avgSpend: 0 };
  }
} 