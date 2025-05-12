import { PostgrestError } from '@supabase/supabase-js';
import { RawApiResponse } from '../types';

export type SubstanceType = 'medication' | 'supplement';
export type SubstanceOrigin = 'RxNorm' | 'SUPP.AI' | 'openFDA' | 'Erowid' | 'User';

export interface Substance {
  id: string;
  name: string;
  display_name: string;
  type: SubstanceType;
  rxcui?: string;
  description?: string;
  origin: SubstanceOrigin;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  substance_a_id: string;
  substance_b_id: string;
  interaction_detected: boolean;
  severity?: 'minor' | 'moderate' | 'severe' | 'unknown' | 'safe';
  risk_score?: number;
  confidence_level?: number;
  sources?: string[];
  api_responses?: Record<string, RawApiResponse>;
  notes?: string;
  flagged_by_user?: boolean;
  first_detected: string;
  last_checked: string;
  updated_at: string;
}

export interface NutrientDepletion {
  id: string;
  medication_name: string;
  depleted_nutrient: string;
  source: string;
  created_at: string;
  substance_id?: string;
}

export type DbResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};
