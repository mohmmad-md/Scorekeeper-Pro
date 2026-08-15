import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SUPABASE CONNECTION
// ============================================================
// You can configure Supabase in TWO ways:
//
// OPTION 1 (Recommended): Use the Settings panel in the app
//   - Click ⚙️ Settings → "Connect Supabase"
//   - Paste your URL and Anon Key
//   - Credentials are saved in localStorage
//
// OPTION 2: Hardcode credentials below (for production builds)
//   - Replace the DEFAULT values with your real credentials
// ============================================================

const DEFAULT_SUPABASE_URL = 'https://rsfboauzekwdmubmuguy.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzZmJvYXV6ZWt3ZG11Ym11Z3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNjA2MDYsImV4cCI6MjA5MTczNjYwNn0.7um8nnPQwzspphIXzkiqns6nTmmwD6JDKkk-pO8QtRY';

let supabaseInstance: SupabaseClient | null = null;

function getCredentials(): { url: string; key: string } {
  const storedUrl = localStorage.getItem('supabase_url');
  const storedKey = localStorage.getItem('supabase_anon_key');

  if (storedUrl && storedKey && !storedUrl.includes('YOUR_PROJECT_ID')) {
    return { url: storedUrl, key: storedKey };
  }

  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
}

export function getSupabase(): SupabaseClient | null {
  try {
    const { url, key } = getCredentials();

    if (!url || !key || url.includes('YOUR_PROJECT_ID')) {
      return null;
    }

    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    }

    return supabaseInstance;
  } catch (e) {
    console.error('Supabase connection error:', e);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

export function resetSupabaseConnection(): void {
  supabaseInstance = null;
}

export function saveSupabaseCredentials(url: string, key: string): void {
  localStorage.setItem('supabase_url', url.trim());
  localStorage.setItem('supabase_anon_key', key.trim());
  supabaseInstance = null;
}

export function clearSupabaseCredentials(): void {
  localStorage.removeItem('supabase_url');
  localStorage.removeItem('supabase_anon_key');
  supabaseInstance = null;
}

export function getSupabaseCredentials(): { url: string; key: string } {
  return getCredentials();
}

// Legacy export for backward compatibility with db.ts
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    if (!client) throw new Error('Supabase is not configured. Please add your credentials in Settings.');
    return client[prop as keyof SupabaseClient];
  },
});
