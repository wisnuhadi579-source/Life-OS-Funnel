/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Primary authoritative configuration: Environment Variables (Vite / Cloudflare Pages)
const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidUrl(val?: string | null): boolean {
  if (!val) return false;
  const str = val.trim();
  return (
    str.startsWith('http') &&
    !str.includes('your-supabase-project') &&
    !str.includes('placeholder.supabase.co')
  );
}

function isValidKey(val?: string | null): boolean {
  if (!val) return false;
  const str = val.trim();
  return (
    str.length > 20 &&
    !str.includes('your-anon-key-here') &&
    !str.includes('placeholder-anon-key')
  );
}

/**
 * Mengambil kredensial Supabase dengan memprioritaskan Environment Variables Vite
 */
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // 1. Primary Source: Vite Environment Variables (Cloudflare Pages deployment)
  if (isValidUrl(ENV_SUPABASE_URL) && isValidKey(ENV_SUPABASE_ANON_KEY)) {
    return { url: ENV_SUPABASE_URL, anonKey: ENV_SUPABASE_ANON_KEY };
  }

  // 2. Secondary fallback: Local storage (hanya jika ada konfigurasi lokal sebelumnya)
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('life_os_supabase_url') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('life_os_supabase_anon_key') : null;

  if (isValidUrl(customUrl) && isValidKey(customKey)) {
    return { url: (customUrl || '').trim(), anonKey: (customKey || '').trim() };
  }

  return {
    url: ENV_SUPABASE_URL || '',
    anonKey: ENV_SUPABASE_ANON_KEY || '',
  };
}

/**
 * Memeriksa apakah konfigurasi Supabase valid dan siap digunakan
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return isValidUrl(url) && isValidKey(anonKey);
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

const { url: activeUrl, anonKey: activeAnonKey } = getSupabaseCredentials();

/**
 * Singleton Supabase Client
 * Menggunakan persistSession: true agar token sesi login pengguna tersimpan aman
 */
export const supabase: SupabaseClient = createClient(
  activeUrl || 'https://placeholder.supabase.co',
  activeAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
