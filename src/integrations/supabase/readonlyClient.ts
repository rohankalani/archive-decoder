import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lightweight, stateless client to avoid auth refresh stalls for public reads
const SUPABASE_URL = "https://xunlqdiappgyokhknvoc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1bmxxZGlhcHBneW9raGtudm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzUwMTQsImV4cCI6MjA3NDQxMTAxNH0.yFpwOFX-as13l6ZXUOaVSa1Kr2CWWzAa9LZzXHB2JAo";

export const readonlySupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
