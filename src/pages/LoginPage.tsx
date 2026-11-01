/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const { user, signIn, authError, clearAuthError, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isConfigured = isSupabaseConfigured();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071B35] flex items-center justify-center text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Memeriksa sesi autentikasi...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !isConfigured) return;

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (!error) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#071B35] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md enterprise-card-elevated p-8 shadow-2xl relative z-10 border-[#1E4D7E]/80">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#071B35] border border-cyan-500/40 text-cyan-400 mb-4 shadow-lg shadow-cyan-500/20">
            <Compass className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Life OS Funnel</h1>
          <p className="text-xs text-cyan-300 font-medium mt-1">
            Personal Business Operating System & Execution Hub
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Terintegrasi Real-time dengan Database FinancialKu
          </p>
        </div>

        {/* Supabase unconfigured informational notice (no credentials prompt) */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Konfigurasi Supabase Belum Tersedia</span>
            </div>
            <p className="text-slate-300">
              Aplikasi ini membutuhkan Environment Variables <code className="bg-[#0B2545] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]">VITE_SUPABASE_URL</code> dan <code className="bg-[#0B2545] px-1.5 py-0.5 rounded text-cyan-300 font-mono text-[11px]">VITE_SUPABASE_ANON_KEY</code> pada konfigurasi deployment Cloudflare Pages.
            </p>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{authError}</span>
            </div>
            <button onClick={clearAuthError} className="text-rose-400 hover:text-white font-bold ml-1">
              ×
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Email Pengguna</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                disabled={!isConfigured}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                disabled={!isConfigured}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isConfigured}
            className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              <>
                <span>Masuk ke Life OS Funnel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Policy Notice */}
        <div className="mt-8 pt-5 border-t border-[#1E4575] text-center text-xs text-slate-400 leading-relaxed space-y-2.5">
          <p>
            Registrasi publik dinonaktifkan sesuai protokol keamanan. Hanya akun terdaftar pada proyek Supabase FinancialKu yang dapat mengakses sistem ini.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>FinancialKu Supabase Auth Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
