import { SupabaseClient } from '@supabase/supabase-js';

export type InteractionSeverity = 'safe' | 'minor' | 'moderate' | 'severe' | 'unknown';

export interface SavedMedication {
  id: string;
  name: string;
  created_at: string;
}

export interface InteractionCheck {
  id: string;
  medications: string[];
  highest_severity: InteractionSeverity;
  created_at: string;
}

export interface InteractionCheckDailyStat {
  day: string;
  total_checks: number;
  caution_checks: number;
}

export async function fetchSavedMedications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('saved_medications')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch saved medications', error);
    return [];
  }

  return (data ?? []) as SavedMedication[];
}

export async function fetchRecentInteractionChecks(
  supabase: SupabaseClient,
  limit = 20
) {
  const { data, error } = await supabase
    .from('interaction_checks')
    .select('id, medications, highest_severity, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch interaction checks', error);
    return [];
  }

  return (data ?? []) as InteractionCheck[];
}

export async function fetchInteractionCheckDailyStats(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('interaction_checks_daily')
    .select('day, total_checks, caution_checks')
    .order('day', { ascending: true });

  if (error) {
    console.error('Failed to fetch interaction check stats', error);
    return [];
  }

  return (data ?? []) as InteractionCheckDailyStat[];
}

