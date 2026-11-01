/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Target,
  Compass,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckSquare,
  Package,
  Layers,
  ChevronRight,
  Zap,
  Activity,
  Award,
  Wallet,
  Building2,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useNorthStarGoals } from '../hooks/useNorthStarGoals';
import { useLifeProfile } from '../hooks/useLifeProfile';
import { useFinancialKuProfit } from '../hooks/useFinancialKuProfit';
import { useExecutionTasks } from '../hooks/useExecutionTasks';
import { useMonthlyEvaluations } from '../hooks/useMonthlyEvaluations';
import { useBusinessTargets } from '../contexts/BusinessTargetsContext';
import { useBusinessSales } from '../hooks/useBusinessSales';
import { calculateFinancialMetrics, calculateBusinessSalesTarget } from '../lib/financialMath';
import {
  formatIDR,
  formatCompactIDR,
  formatPercent,
  formatMonthYearIndo,
  getCurrentMonthStart,
} from '../lib/formatters';

export const DashboardPage: React.FC = () => {
  const { coreDriver, goals, loading: loadingGoals } = useNorthStarGoals();
  const { profile, loading: loadingProfile } = useLifeProfile();
  const {
    netProfit: liveNetProfit,
    loading: loadingProfit,
    error: profitError,
    lastUpdated: profitLastUpdated,
    refetch: refetchProfit,
  } = useFinancialKuProfit();

  const currentMonthStart = getCurrentMonthStart();
  const { tasks, moveTaskStatus, loading: loadingTasks } = useExecutionTasks();
  const { evaluations, loading: loadingEvals } = useMonthlyEvaluations();
  const { targets: businessTargets, loading: loadingBusinessTargets } = useBusinessTargets();
  const { monthlyTotals, loading: loadingSales } = useBusinessSales();

  const [activeChartTab, setActiveChartTab] = useState<'monthly' | 'cumulative' | 'percent'>('monthly');

  // Derive metrics strictly from Core Driver
  const metrics = calculateFinancialMetrics(coreDriver, profile, liveNetProfit);
  const monthlyNorthStar = metrics.monthlyTarget;

  // Derive business targets
  const jamuTarget = businessTargets.find((t) => t.business_key === 'jamu_herbal');
  const spiritualTarget = businessTargets.find((t) => t.business_key === 'akademi_spiritual');
  const pakarTarget = businessTargets.find((t) => t.business_key === 'pakar_digital');

  const jamuCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    jamuTarget?.allocation_percentage ?? 10,
    jamuTarget?.profit_per_unit ?? 10000,
    jamuTarget?.planning_days_per_month ?? 30,
    jamuTarget?.sales_unit ?? 'botol 500 ml',
    'jamu_herbal'
  );

  const spiritualCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    spiritualTarget?.allocation_percentage ?? 50,
    spiritualTarget?.profit_per_unit ?? 10000,
    spiritualTarget?.planning_days_per_month ?? 30,
    spiritualTarget?.sales_unit ?? 'member',
    'akademi_spiritual'
  );

  const pakarCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    pakarTarget?.allocation_percentage ?? 40,
    pakarTarget?.profit_per_unit ?? 50000,
    pakarTarget?.planning_days_per_month ?? 30,
    pakarTarget?.sales_unit ?? 'produk',
    'pakar_digital'
  );

  // Today's tasks (Rule of 3)
  const todayTasks = tasks.filter((t) => t.status === 'today');

  // Find current month's evaluation
  const currentMonthEval = evaluations.find((e) => e.month_start === currentMonthStart);

  // Chart data from saved monthly evaluation snapshots ONLY
  const sortedEvals = [...evaluations].sort((a, b) => a.month_start.localeCompare(b.month_start));

  let cumulativeTarget = 0;
  let cumulativeActual = 0;

  const chartData = sortedEvals.map((evaluation) => {
    const monthLabel = formatMonthYearIndo(evaluation.month_start);
    const target = evaluation.monthly_target ?? 0;
    const actual = evaluation.actual_net_profit ?? 0;
    const percent = target > 0 ? (actual / target) * 100 : 0;

    cumulativeTarget += target;
    cumulativeActual += actual;

    return {
      monthKey: evaluation.month_start,
      name: monthLabel,
      target,
      actual,
      targetFormatted: formatIDR(target),
      actualFormatted: formatIDR(actual),
      cumulativeTarget,
      cumulativeActual,
      cumulativeTargetFormatted: formatIDR(cumulativeTarget),
      cumulativeActualFormatted: formatIDR(cumulativeActual),
      achievementPct: Number(percent.toFixed(1)),
      status: evaluation.status,
    };
  });

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* 1. ENTERPRISE HERO BANNER (Inspirasi Layout & Visual Referensi) */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2A4D] via-[#103A6B] to-[#0A2240] border border-[#1E4D7E]/70 p-6 sm:p-8 shadow-2xl shadow-black/40">
        {/* Subtle geometric & radial glow background */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-600" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3.5 max-w-3xl">
            {/* Pill Header */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#071B35]/80 border border-cyan-500/30 text-xs font-semibold text-cyan-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="tracking-wide">CORE DRIVER AKTIF — SINGLE NORTH STAR</span>
              {coreDriver && (
                <>
                  <span className="text-[#3A6088]">|</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    {coreDriver.target_years} Tahun
                  </span>
                  <span className="text-[#3A6088]">|</span>
                  <span className="text-slate-300 font-mono text-[11px]">
                    Tenggat: {coreDriver.target_deadline || 'Belum diatur'}
                  </span>
                </>
              )}
            </div>

            {coreDriver ? (
              <>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                    {coreDriver.title}
                  </h1>
                  {coreDriver.emotional_reason && (
                    <p className="text-sm text-cyan-100/80 italic border-l-2 border-cyan-400/50 pl-3.5 py-0.5 mt-2 max-w-2xl leading-relaxed">
                      "{coreDriver.emotional_reason}"
                    </p>
                  )}
                </div>

                {/* Metric Summary Badges */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#071B35]/70 border border-[#1E4D7E]/60 text-xs flex items-center gap-2">
                    <span className="text-slate-400">Total Visi:</span>
                    <strong className="text-white font-mono font-bold">
                      {formatIDR(coreDriver.target_amount)}
                    </strong>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-[#071B35]/70 border border-[#1E4D7E]/60 text-xs flex items-center gap-2">
                    <span className="text-slate-400">Target Tahunan:</span>
                    <strong className="text-slate-200 font-mono font-bold">
                      {formatIDR(metrics.annualTarget)}
                    </strong>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-xs flex items-center gap-2 text-cyan-300">
                    <span className="text-cyan-200/80 font-medium">Target Net Profit Bulanan:</span>
                    <strong className="text-cyan-300 font-mono font-extrabold text-sm">
                      {formatIDR(metrics.monthlyTarget)}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-2 space-y-2">
                <h2 className="text-xl font-bold text-white">
                  Belum Ada Core Driver yang Dipilih
                </h2>
                <p className="text-sm text-slate-300 max-w-xl">
                  Pilih salah satu target North Star sebagai pendorong utama (Core Driver) untuk
                  mengaktifkan perhitungan hierarki target finansial dan operasional tiga bisnis.
                </p>
                <Link
                  to="/north-star"
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pilih Core Driver Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick link & Multi-business card */}
          <div className="lg:border-l lg:border-[#1E4D7E]/70 lg:pl-6 shrink-0 flex flex-col justify-center space-y-3">
            <div className="p-4 rounded-xl bg-[#071B35]/75 border border-[#1E4D7E]/60 max-w-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-cyan-400">
                <span>Multi-Bisnis Sync</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px]">
                  100% Terdistribusi
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">
                Target penjualan 3 bisnis dikalibrasi otomatis untuk merealisasikan North Star bulanan.
              </p>
              <Link
                to="/target-hierarchy"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors pt-1"
              >
                <span>Konfigurasi Target Hierarchy</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FINANCIAL KPI STRIP - 4 ENTERPRISE CARDS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Metrik Finansial Net Profit</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-[#0B2545] px-3 py-1 rounded-lg border border-[#1E4575]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Basis: Net Profit (Bukan Omzet Bruto)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Target Bulanan North Star (Blue Glow) */}
          <div className="enterprise-card p-5 space-y-3 relative group hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Target Net Profit Bulanan
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Target className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl lg:text-3xl font-extrabold font-mono text-white tracking-tight">
                {formatIDR(metrics.monthlyTarget)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-cyan-400 font-mono">North Star</span>
                <span>{formatCompactIDR(metrics.northStarAmount)}</span>
                <span>/</span>
                <span>{metrics.targetYears * 12} bulan</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E4575]/70 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status Alokasi:</span>
              <span className="font-semibold text-cyan-300">Tunggal (100%)</span>
            </div>
          </div>

          {/* Card 2: Live Net Profit from FinancialKu (Emerald Glow) */}
          <div className="enterprise-card p-5 space-y-3 relative group border-emerald-500/30 hover:border-emerald-400/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Net Profit FinancialKu
              </span>
              <button
                onClick={() => refetchProfit()}
                disabled={loadingProfit}
                title="Perbarui data dari FinancialKu"
                className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loadingProfit ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingProfit ? (
              <div className="py-2 flex items-center gap-2 text-xs text-slate-400">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>Sinkronisasi FinancialKu...</span>
              </div>
            ) : profitError ? (
              <div className="py-1 space-y-1">
                <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {profitError}
                </p>
                <button
                  onClick={() => refetchProfit()}
                  className="text-[11px] text-emerald-400 hover:underline"
                >
                  Coba lagi
                </button>
              </div>
            ) : (
              <div>
                <div className="text-2xl lg:text-3xl font-extrabold font-mono text-emerald-300 tracking-tight">
                  {formatIDR(liveNetProfit)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>3 Rekening Profit</span>
                  <span className="font-mono text-slate-400">
                    {profitLastUpdated
                      ? `Sync: ${profitLastUpdated.toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      : 'Live'}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#1E4575]/70 flex items-center justify-between text-[11px] text-slate-400">
              <span>Status Koneksi:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Real-time Terhubung
              </span>
            </div>
          </div>

          {/* Card 3: Persentase Pencapaian & Gap (Cyan Glow) */}
          <div className="enterprise-card p-5 space-y-3 relative group hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pencapaian Bulan Ini
              </span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <div
                  className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${
                    (metrics.achievementPercentage ?? 0) >= 100
                      ? 'text-emerald-400'
                      : (metrics.achievementPercentage ?? 0) >= 50
                      ? 'text-cyan-300'
                      : 'text-amber-400'
                  }`}
                >
                  {metrics.achievementPercentage !== null
                    ? formatPercent(metrics.achievementPercentage)
                    : '-'}
                </div>
                {metrics.monthlyTarget > 0 && liveNetProfit !== null && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    dari {formatCompactIDR(metrics.monthlyTarget)}
                  </span>
                )}
              </div>

              <div className="text-[11px] mt-1">
                {metrics.positiveShortfall > 0 ? (
                  <span className="text-slate-400">
                    Sisa gap:{' '}
                    <strong className="text-amber-400 font-mono font-bold">
                      {formatIDR(metrics.positiveShortfall)}
                    </strong>
                  </span>
                ) : metrics.monthlyTarget > 0 && liveNetProfit !== null ? (
                  <span className="text-emerald-400 font-medium">✓ Target bulan ini tercapai</span>
                ) : (
                  <span className="text-slate-400">Menunggu data target & net profit</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E4575]/70 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tingkat Kinerja:</span>
              <span
                className={`font-semibold ${
                  (metrics.achievementPercentage ?? 0) >= 100
                    ? 'text-emerald-400'
                    : (metrics.achievementPercentage ?? 0) >= 50
                    ? 'text-cyan-300'
                    : 'text-amber-400'
                }`}
              >
                {(metrics.achievementPercentage ?? 0) >= 100
                  ? 'On Track (100%+)'
                  : (metrics.achievementPercentage ?? 0) >= 50
                  ? 'Progress Sedang'
                  : 'Perlu Akselerasi'}
              </span>
            </div>
          </div>

          {/* Card 4: Target Penjualan Tiga Bisnis (Purple Glow) */}
          <div className="enterprise-card p-5 space-y-3 relative group hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Target Penjualan 3 Bisnis
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* Jamu Herbal */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Jamu ({jamuCalc.allocationPercentage}%):
                </span>
                <span className="font-bold text-white font-mono">
                  {jamuCalc.monthlySalesTarget} <span className="text-[10px] text-slate-400">({jamuCalc.dailySalesTarget}/hr)</span>
                </span>
              </div>
              {/* Akademi Spiritual */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Akademi ({spiritualCalc.allocationPercentage}%):
                </span>
                <span className="font-bold text-white font-mono">
                  {spiritualCalc.monthlySalesTarget} <span className="text-[10px] text-slate-400">({spiritualCalc.dailySalesTarget}/hr)</span>
                </span>
              </div>
              {/* Pakar Digital */}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Pakar ({pakarCalc.allocationPercentage}%):
                </span>
                <span className="font-bold text-white font-mono">
                  {pakarCalc.monthlySalesTarget} <span className="text-[10px] text-slate-400">({pakarCalc.dailySalesTarget}/hr)</span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E4575]/70 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Total Unit:</span>
              <Link to="/target-hierarchy" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                <span>Rincian</span> <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROGRES PENJUALAN BULAN INI (3 BUSINESS ENTERPRISE CARDS) */}
      <section className="enterprise-card p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-5 bg-gradient-to-b from-emerald-400 to-cyan-500 rounded-full" />
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Progres Penjualan Unit Tiga Bisnis Bulan Ini</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Realisasi unit terjual dari input harian di Execution Board dibandingkan target bulanan per bisnis.
            </p>
          </div>
          <Link
            to="/execution"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#0B2545] border border-cyan-500/30 text-cyan-300 hover:bg-[#15385F] hover:text-white transition-all flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>Input Penjualan Hari Ini</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Jamu Herbal Progress */}
          {(() => {
            const actual = monthlyTotals['jamu_herbal'] || 0;
            const target = jamuCalc.monthlySalesTarget;
            const pct = target > 0 ? (actual / target) * 100 : 0;
            const remaining = Math.max(0, target - actual);
            return (
              <div className="p-5 rounded-xl bg-[#0B2545]/90 border border-[#193F6C] hover:border-emerald-500/40 transition-all space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Jamu Herbal</h4>
                      <span className="text-[10px] text-slate-400">Alokasi {jamuCalc.allocationPercentage}%</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-[#071B35] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#1E4575]">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-[#071B35]/70 border border-[#1E4575]/50">
                    <div className="text-[10px] text-slate-400">Terjual</div>
                    <div className="text-white font-mono font-bold text-sm">
                      {actual} <span className="text-[10px] text-slate-400 font-normal">/ {target} botol</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#071B35]/70 border border-[#1E4575]/50">
                    <div className="text-[10px] text-slate-400">Sisa Target</div>
                    <div className="text-amber-400 font-mono font-bold text-sm">
                      {remaining} <span className="text-[10px] text-slate-400 font-normal">botol</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#1E4575]/50">
                  <span>Target Harian:</span>
                  <span className="font-mono font-semibold text-slate-200">{jamuCalc.dailySalesTarget} botol / hari</span>
                </div>
              </div>
            );
          })()}

          {/* Akademi Spiritual Progress */}
          {(() => {
            const actual = monthlyTotals['akademi_spiritual'] || 0;
            const target = spiritualCalc.monthlySalesTarget;
            const pct = target > 0 ? (actual / target) * 100 : 0;
            const remaining = Math.max(0, target - actual);
            return (
              <div className="p-5 rounded-xl bg-[#0B2545]/90 border border-[#193F6C] hover:border-purple-500/40 transition-all space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Akademi Spiritual</h4>
                      <span className="text-[10px] text-slate-400">Alokasi {spiritualCalc.allocationPercentage}%</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-purple-400 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-[#071B35] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#1E4575]">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-indigo-400 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-[#071B35]/70 border border-[#1E4575]/50">
                    <div className="text-[10px] text-slate-400">Terjual</div>
                    <div className="text-white font-mono font-bold text-sm">
                      {actual} <span className="text-[10px] text-slate-400 font-normal">/ {target} member</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#071B35]/70 border border-[#1E4575]/50">
                    <div className="text-[10px] text-slate-400">Sisa Target</div>
                    <div className="text-amber-400 font-mono font-bold text-sm">
                      {remaining} <span className="text-[10px] text-slate-400 font-normal">member</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#1E4575]/50">
                  <span>Target Harian:</span>
                  <span className="font-mono font-semibold text-slate-200">{spiritualCalc.dailySalesTarget} member / hari</span>
                </div>
              </div>
            );
          })()}

          {/* Pakar Digital Progress */}
          {(() => {
            const actual = monthlyTotals['pakar_digital'] || 0;
            const target = pakarCalc.monthlySalesTarget;
            const pct = target > 0 ? (actual / target) * 100 : 0;
            const remaining = Math.max(0, target - actual);
            return (
              <div className="p-5 rounded-xl bg-[#0B2545]/90 border border-[#193F6C] hover:border-cyan-500/40 transition-all space-y-3.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Pakar Digital</h4>
                      <span className="text-[10px] text-slate-400">Alokasi {pakarCalc.allocationPercentage}%</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-cyan-400 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                    {pct.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-[#071B35] rounded-full h-2.5 overflow-hidden p-0.5 border border-[#1E4575]">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2 rounded-lg bg-[#071B35]/70 border border-[#1E4575]/50">
                    <div className="text-[10px] text-slate-400">Terjual</div>
                    <div className="text-white font-mono font-bold text-sm">
                      {actual} <span className="text-[10px] text-slate-400 font-normal">/ {target} produk</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#071B35]/70 border border-[#1E4575]/50">
                    <div className="text-[10px] text-slate-400">Sisa Target</div>
                    <div className="text-amber-400 font-mono font-bold text-sm">
                      {remaining} <span className="text-[10px] text-slate-400 font-normal">produk</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-[#1E4575]/50">
                  <span>Target Harian:</span>
                  <span className="font-mono font-semibold text-slate-200">{pakarCalc.dailySalesTarget} produk / hari</span>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 4. MIDDLE GRID: PRIORITAS HARI INI (RULE OF 3) & MONTHLY REVIEW STATUS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Priorities - Rule of 3 (2 cols) */}
        <div className="lg:col-span-2 enterprise-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Prioritas Hari Ini</h3>
                <span className="text-xs bg-[#071B35] border border-[#1E4575] text-cyan-300 font-mono px-2 py-0.5 rounded-md">
                  {todayTasks.length}/3 Fokus
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rule of 3: Batasi maksimal 3 fokus utama per hari untuk menjamin eksekusi tuntas.
              </p>
            </div>
            <Link
              to="/execution"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Buka Kanban Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[#1E4575] rounded-xl bg-[#071B35]/50 space-y-2">
              <CheckSquare className="w-7 h-7 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                Belum ada tugas yang ditetapkan ke "Prioritas Hari Ini".
              </p>
              <Link
                to="/execution"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#15385F] hover:bg-[#1C4675] text-xs font-semibold text-slate-200 rounded-lg transition-colors border border-[#1E4575]"
              >
                Pilih Dari Backlog
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => {
                const bKey = task.business_key;
                const bLabel =
                  bKey === 'jamu_herbal'
                    ? 'Jamu Herbal'
                    : bKey === 'akademi_spiritual'
                    ? 'Akademi Spiritual'
                    : bKey === 'pakar_digital'
                    ? 'Pakar Digital'
                    : null;

                const bBadgeClass =
                  bKey === 'jamu_herbal'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : bKey === 'akademi_spiritual'
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';

                return (
                  <div
                    key={task.id}
                    className="p-3.5 bg-[#0B2545]/80 border border-[#193F6C] rounded-xl flex items-center justify-between gap-4 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {bLabel && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${bBadgeClass}`}>
                            {bLabel}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase font-mono ${
                            task.task_type === 'lead_measure'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : 'bg-[#071B35] text-slate-300 border border-[#1E4575]'
                          }`}
                        >
                          {task.task_type === 'lead_measure' ? 'Lead Measure' : 'Support'}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-100 truncate">{task.title}</h4>
                      </div>
                      {task.description && (
                        <p
                          className="text-xs text-slate-300/90 whitespace-pre-wrap break-words leading-relaxed"
                          style={{ overflowWrap: 'anywhere' }}
                        >
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>Estimasi: {task.estimated_minutes ?? task.estimated_duration ?? 0} mnt</span>
                        {task.outreach_count > 0 && (
                          <span>Outreach: {task.outreach_count} kontak</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => moveTaskStatus(task.id, 'done')}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Current Monthly Review Card (1 col) */}
        <div className="enterprise-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                EVALUASI BULANAN
              </span>
              <span className="text-xs text-slate-300 font-mono bg-[#071B35] px-2 py-0.5 rounded border border-[#1E4575]">
                {formatMonthYearIndo(currentMonthStart)}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">Status Review Bulan Ini</h3>

            {currentMonthEval ? (
              <div className="p-4 rounded-xl bg-[#0B2545]/80 border border-[#193F6C] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Status Catatan:</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded font-mono uppercase ${
                      currentMonthEval.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    {currentMonthEval.status === 'completed' ? 'Tersimpan (Selesai)' : 'Draft Berjalan'}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Net Profit Snapshot:</span>
                  <strong className="text-white font-mono">
                    {formatIDR(currentMonthEval.actual_net_profit)}
                  </strong>
                </div>
                <div className="text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Total Outreach:</span>
                  <strong className="text-cyan-300 font-mono">{currentMonthEval.outreach_count} kontak</strong>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#071B35]/50 border border-dashed border-[#1E4575] space-y-2">
                <p className="text-xs text-slate-300">
                  Belum ada catatan evaluasi resmi untuk bulan berjalan ini.
                </p>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  Disarankan mengisi evaluasi di akhir bulan atau awal bulan berikutnya untuk dokumentasi performa.
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/monthly-review"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all"
            >
              <span>Buka Menu Evaluasi Bulanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. HISTORICAL CHARTS SECTION */}
      <section className="enterprise-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tren Evaluasi Bulanan (Historis)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan data snapshot dari evaluasi bulanan yang sudah tersimpan di database.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#071B35] p-1 rounded-xl border border-[#1E4575]">
            <button
              onClick={() => setActiveChartTab('monthly')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setActiveChartTab('cumulative')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'cumulative'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kumulatif
            </button>
            <button
              onClick={() => setActiveChartTab('percent')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeChartTab === 'percent'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pencapaian %
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-[#1E4575] rounded-xl bg-[#071B35]/40 space-y-2">
            <Calendar className="w-8 h-8 text-cyan-500/50 mx-auto" />
            <p className="text-sm text-slate-300 font-medium">Belum ada riwayat evaluasi bulanan yang tersimpan.</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Bagan akan terisi otomatis setelah Anda menyimpan evaluasi bulanan pertama di menu Monthly Review.
            </p>
            <Link
              to="/monthly-review"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mt-2 bg-[#15385F] hover:bg-[#1C4675] text-xs font-semibold text-cyan-300 rounded-lg transition-colors border border-[#1E4575]"
            >
              Buat Evaluasi Bulanan
            </Link>
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'monthly' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E4575" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => formatCompactIDR(val)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#071B35', borderColor: '#22D3EE', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                    formatter={(val: any) => formatIDR(Number(val))}
                  />
                  <Legend />
                  <Bar dataKey="target" name="Target Net Profit" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="actual" name="Realisasi Net Profit" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : activeChartTab === 'cumulative' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E4575" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => formatCompactIDR(val)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#071B35', borderColor: '#22D3EE', borderRadius: '12px' }}
                    formatter={(val: any) => formatIDR(Number(val))}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cumulativeTarget"
                    name="Target Kumulatif"
                    stroke="#0EA5E9"
                    strokeWidth={2.5}
                    dot={{ fill: '#0EA5E9', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeActual"
                    name="Realisasi Kumulatif"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E4575" opacity={0.6} />
                  <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#071B35', borderColor: '#22D3EE', borderRadius: '12px' }}
                    formatter={(val: any) => `${val}%`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="achievementPct"
                    name="Pencapaian (%)"
                    stroke="#22D3EE"
                    strokeWidth={2.5}
                    dot={{ fill: '#22D3EE', r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
};
