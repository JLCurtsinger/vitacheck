
/**
 * Medication Pair Processing Utilities
 * 
 * This module handles the core logic for processing medication pairs and determining
 * interaction severity based on multiple data sources. It implements a comprehensive
 * checking system that queries multiple medical databases and aggregates their results.
 * 
 * @module pair-processing-utils
 * @deprecated Use the modular approach from ./pair-processing/* instead
 */

// Re-export from the new modular structure
export * from './pair-processing';

// Import supabase client for backward compatibility
import { supabase } from "@/integrations/supabase/client";

