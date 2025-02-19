
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kqbytrxntxdelgltcmqj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYnl0cnhudHhkZWxnbHRjbXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMDI3NjAsImV4cCI6MjA1MTg3ODc2MH0.7F2ANCrynm8nasGIfQ16dNNJic7rbZaFXHWO9L_eCwQ';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase configuration');
}

// Create a single instance to be used throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export URL and key for edge functions if needed
export { supabaseUrl, supabaseAnonKey };
