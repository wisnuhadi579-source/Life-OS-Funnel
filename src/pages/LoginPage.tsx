/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Database, Compass } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured, getSupabaseCredentials, saveCustomSupabaseCredentials } from '../lib/supabase';

export const LoginPage: React.FC = () => {
  const { user, signIn, authError, clearAuthError, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Fallback config inputs
  const currentCreds = getSupabaseCredentials();
  const [customUrl, setCustomUrl] = useState(currentCreds.url);
  const [customKey, setCustomKey] = useState(currentCreds.anonKey);

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
    if (!email.trim() || !password) return;

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (!error) {
      navigate('/');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl && customKey) {
      saveCustomSupabaseCredentials(customUrl, customKey);
      setShowConfigModal(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

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

        {/* Supabase unconfigured warning */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Koneksi Supabase Belum Dikonfigurasi</span>
            </div>
            <p className="text-slate-300">
              Aplikasi ini membutuhkan URL dan Anon Key proyek Supabase FinancialKu yang aktif untuk autentikasi.
            </p>
            <button
              onClick={() => setShowConfigModal(true)}
              className="mt-2 text-xs font-semibold underline text-cyan-300 hover:text-white inline-block"
            >
              Atur Kredensial Supabase Sekarang
            </button>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
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
        <div className="mt-8 pt-5 border-t border-[#1E4575] text-center text-xs text-slate-400 leading-relaxed">
          <p>
            Registrasi publik dinonaktifkan sesuai protokol keamanan. Hanya akun terdaftar pada proyek Supabase FinancialKu yang dapat mengakses sistem ini.
          </p>
          <div className="mt-3">
            <button
              onClick={() => setShowConfigModal(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 font-medium transition"
            >
              <Database className="w-3.5 h-3.5" /> Konfigurasi Proyek Supabase
            </button>
          </div>
        </div>
      </div>

      {/* Manual Supabase Connection Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#102D50] border border-[#1E4575] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <span>Kredensial Supabase FinancialKu</span>
            </h3>
            <p className="text-xs text-slate-300">
              Masukkan URL dan Anon Public Key dari proyek Supabase Anda. Nilai ini disimpan di browser Anda untuk sesi lokal.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  VITE_SUPABASE_URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyz.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  VITE_SUPABASE_ANON_KEY
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3 py-2 text-xs text-white font-mono resize-none focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white bg-[#0B2545] rounded-lg border border-[#1E4575] transition"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition shadow-md shadow-blue-500/20"
                >
                  Simpan & Terapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
