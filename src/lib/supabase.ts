import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured (not empty and not placeholders)
export const isSupabaseConfigured = () => {
    return !!supabaseUrl &&
        supabaseUrl !== 'your_supabase_url' &&
        !!supabaseAnonKey &&
        supabaseAnonKey !== 'your_supabase_key';
};

// Only initialize if configured, otherwise use placeholders that won't throw on initialization
// even if they fail on actual requests (which we skip in isDemo mode anyway)
const INITIAL_URL = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const INITIAL_KEY = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key';

if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not fully configured. App will run in Demo Mode.');
}

export const supabase = createClient(INITIAL_URL, INITIAL_KEY);
