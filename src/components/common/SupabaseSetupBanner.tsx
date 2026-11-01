/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const SupabaseSetupBanner: React.FC = () => {
  return (
    <div className="bg-[#0B2545] border border-amber-500/30 rounded-2xl p-5 text-slate-200 my-4 max-w-4xl mx-auto shadow-xl">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 flex-1 text-xs">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Konfigurasi Supabase Diperlukan</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Cloudflare Pages
            </span>
          </h3>
          <p className="text-slate-300 leading-relaxed">
            Aplikasi Life OS Funnel membutuhkan konfigurasi Environment Variables agar otomatis terhubung ke proyek Supabase FinancialKu.
          </p>
          <div className="p-3 rounded-xl bg-[#071B35] border border-[#1E4575] font-mono text-[11px] text-cyan-300 space-y-1 mt-2">
            <div>VITE_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co</div>
            <div>VITE_SUPABASE_ANON_KEY=[YOUR-ANON-PUBLIC-KEY]</div>
          </div>
          <p className="text-slate-400 text-[11px] pt-1">
            Tambahkan kedua variabel di atas pada dashboard Cloudflare Pages: <strong className="text-slate-200">Settings &gt; Environment variables &gt; Production</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
