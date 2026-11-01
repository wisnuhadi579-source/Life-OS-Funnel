/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow stored configuration if env vars are pending injection in preview
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('life_os_supabase_url') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('life_os_supabase_anon_key') : null;

  const url = (ENV_SUPABASE_URL && ENV_SUPABASE_URL !== 'https://your-supabase-project.supabase.co' ? ENV_SUPABASE_URL : '') || customUrl || '';
  const anonKey = (ENV_SUPABASE_ANON_KEY && ENV_SUPABASE_ANON_KEY !== 'your-anon-key-here' ? ENV_SUPABASE_ANON_KEY : '') || customKey || '';

  return { url: url.trim(), anonKey: anonKey.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('life_os_supabase_url', url.trim());
    localStorage.setItem('life_os_supabase_anon_key', anonKey.trim());
    window.location.reload();
  }
}

export function clearCustomSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('life_os_supabase_url');
    localStorage.removeItem('life_os_supabase_anon_key');
    window.location.reload();
  }
}

const { url, anonKey } = getSupabaseCredentials();

// Initialize client with fallback placeholder to prevent crash during initial load before config
export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
