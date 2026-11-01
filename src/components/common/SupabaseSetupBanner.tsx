/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Key, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getSupabaseCredentials, saveCustomSupabaseCredentials } from '../../lib/supabase';

export const SupabaseSetupBanner: React.FC = () => {
  const currentCreds = getSupabaseCredentials();
  const [url, setUrl] = useState(currentCreds.url);
  const [anonKey, setAnonKey] = useState(currentCreds.anonKey);
  const [saved, setSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;
    saveCustomSupabaseCredentials(url, anonKey);
    setSaved(true);
  };

  return (
    <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6 text-slate-200 my-6 max-w-2xl mx-auto shadow-xl">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2 flex-1">
          <h3 className="text-base font-semibold text-slate-100">
            Konfigurasi Proyek Supabase FinancialKu Diperlukan
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Life OS Funnel menggunakan proyek Supabase yang sama dengan FinancialKu. Pastikan variabel lingkungan{' '}
            <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> dan{' '}
            <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> telah diisi di file environment atau dapat Anda masukkan secara langsung di bawah ini.
          </p>

          {!isOpen ? (
            <button
              onClick={() => setIsOpen(true)}
              className="mt-3 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Key className="w-4 h-4" /> Masukkan Kredensial Supabase
            </button>
          ) : (
            <form onSubmit={handleSave} className="mt-4 space-y-3 pt-3 border-t border-slate-800">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Supabase Anon Key (Public)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Simpan & Hubungkan
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Batal
                </button>
                {saved && (
                  <span className="text-xs text-emerald-400 inline-flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memuat ulang...
                  </span>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
