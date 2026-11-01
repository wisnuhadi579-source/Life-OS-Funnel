/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  WalletCards,
  RefreshCw,
} from 'lucide-react';
import { useLifeProfile } from '../hooks/useLifeProfile';
import { useAuth } from '../contexts/AuthContext';
import { useFinancialKuProfit } from '../hooks/useFinancialKuProfit';
import { formatIDR } from '../lib/formatters';

export const SettingsPage: React.FC = () => {
  const { profile, loading, updateProfile } = useLifeProfile();
  const { user, isConfigured } = useAuth();
  const {
    netProfit,
    loading: loadingProfit,
    error: profitError,
    lastUpdated: profitLastUpdated,
    refetch: refetchProfit,
  } = useFinancialKuProfit();

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState<number>(5);
  const [dailyOutreachTarget, setDailyOutreachTarget] = useState<number>(10);
  const [planningStartDate, setPlanningStartDate] = useState('2026-01-01');

  // Status
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBusinessName(profile.business_name || '');
      setWorkingDaysPerWeek(profile.working_days_per_week || 5);
      setDailyOutreachTarget(profile.daily_outreach_target || 10);
      setPlanningStartDate(profile.planning_start_date || '2026-01-01');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations: No negative numbers
    if (workingDaysPerWeek < 1 || workingDaysPerWeek > 7) {
      setStatusMsg({ type: 'error', text: 'Hari kerja per minggu harus berada di antara 1 dan 7 hari.' });
      return;
    }
    if (dailyOutreachTarget < 0) {
      setStatusMsg({ type: 'error', text: 'Target outreach harian tidak boleh bernilai negatif.' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    const res = await updateProfile({
      display_name: displayName.trim(),
      business_name: businessName.trim(),
      average_package_price: profile?.average_package_price ?? 0,
      expected_net_margin_pct: profile?.expected_net_margin_pct ?? 0,
      working_days_per_week: workingDaysPerWeek,
      daily_outreach_target: dailyOutreachTarget,
      planning_start_date: planningStartDate,
    });

    setSaving(false);
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Pengaturan profil dan kapasitas harian berhasil disimpan.' });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Gagal menyimpan profil.' });
    }
  };

  const isSupabaseConnected = Boolean(isConfigured && !profitError);
  const formattedLastSync = profitLastUpdated
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
      }).format(profitLastUpdated) + ' WIB'
    : 'Belum ada data sinkronisasi';

  return (
    <div className="space-y-7 max-w-4xl pb-12">
      {/* Header */}
      <div className="border-b border-[#1E4575] pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-cyan-400" />
          <span>Pengaturan & Asumsi Operasional</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola profil pengguna, kapasitas aktivitas harian, dan konfigurasi integrasi database.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <section className="enterprise-card p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>1. Profil & Identitas Pengguna</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Tampilan (Display Name)
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama Anda"
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Bisnis / Brand Utama (Opsional)
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Contoh: Ekosistem 3 Bisnis"
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </section>

        {/* Model Target Operasional Bisnis Information Card */}
        <section className="enterprise-card p-6 md:p-8 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-2 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <span>2. Model Target Tiga Bisnis (Life OS Funnel V2)</span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                Hanya ada SATU target finansial, yaitu North Star. Target ketiga bisnis bukan nominal uang terpisah, melainkan kuota unit penjualan (botol Jamu Herbal, member Akademi Spiritual, dan produk Pakar Digital) yang dihitung otomatis berdasarkan alokasi persentase terhadap North Star bulanan.
              </p>
            </div>
            <Link
              to="/target-hierarchy"
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition flex items-center gap-2 shrink-0"
            >
              <span>Konfigurasi Target Hierarchy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Operating Cadence Card */}
        <section className="enterprise-card p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>3. Kapasitas Waktu & Lead Measures Harian</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hari Kerja per Minggu
              </label>
              <input
                type="number"
                min="1"
                max="7"
                required
                value={workingDaysPerWeek}
                onChange={(e) => setWorkingDaysPerWeek(Number(e.target.value))}
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                ≈ {Math.round(workingDaysPerWeek * 4.33)} hari / bulan
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Outreach Harian
              </label>
              <input
                type="number"
                min="0"
                required
                value={dailyOutreachTarget}
                onChange={(e) => setDailyOutreachTarget(Number(e.target.value))}
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Asumsi aktivitas outreach harian (Lead Measure)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tanggal Mulai Perencanaan
              </label>
              <input
                type="date"
                required
                value={planningStartDate}
                onChange={(e) => setPlanningStartDate(e.target.value)}
                className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </section>
      </form>

      {/* Status Integrasi FinancialKu (Aman tanpa paparan kredensial) */}
      <section className="enterprise-card p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#1E4575] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <WalletCards className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Status Integrasi FinancialKu</h3>
              <p className="text-xs text-slate-400">
                Koneksi sinkronisasi data real-time dengan basis data FinancialKu.
              </p>
            </div>
          </div>

          {/* Connected / Disconnected Badge */}
          <div className="flex items-center gap-2.5">
            {isSupabaseConnected ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" />
                <span>Disconnected</span>
              </span>
            )}
          </div>
        </div>

        {/* Sync Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 rounded-xl bg-[#071B35] border border-[#1E4575] space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider font-semibold">
              Koneksi Layanan
            </span>
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isSupabaseConnected ? 'text-emerald-400' : 'text-rose-400'}`} />
              <span className="text-xs font-bold text-white">
                {isSupabaseConnected ? 'Supabase Database & RPC Terhubung' : 'Koneksi Terputus / Tidak Tersedia'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#071B35] border border-[#1E4575] space-y-1 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider font-semibold">
                Last Sync (Waktu Sinkronisasi)
              </span>
              <span className="text-xs font-bold text-white font-mono">
                {formattedLastSync}
              </span>
            </div>

            <button
              type="button"
              onClick={() => refetchProfit()}
              disabled={loadingProfit}
              className="p-2 rounded-lg bg-[#0B2545] hover:bg-[#102D50] border border-[#1E4575] text-cyan-400 hover:text-cyan-300 transition disabled:opacity-50"
              title="Sinkronkan Ulang Sekarang"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProfit ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
