
import { InteractionResult } from '../types';

/**
 * Result type for combination processing that extends the base InteractionResult
 */
export interface CombinationResult extends InteractionResult {
  type: 'single' | 'pair' | 'triple';
  label: string;
}

/**
 * Fallback result for when an interaction cannot be properly processed
 */
export interface FallbackOptions {
  medications: string[];
  type: 'single' | 'pair' | 'triple';
  error?: string;
}
