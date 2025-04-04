
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// Get environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || ''
);
