/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Trophy,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Package,
  Users,
  Laptop,
  Check,
  Building2,
  Activity,
} from 'lucide-react';
import { useMonthlyEvaluations } from '../hooks/useMonthlyEvaluations';
import { useNorthStarGoals } from '../hooks/useNorthStarGoals';
import { useLifeProfile } from '../hooks/useLifeProfile';
import { useFinancialKuProfit } from '../hooks/useFinancialKuProfit';
import { useBusinessTargets } from '../contexts/BusinessTargetsContext';
import { useBusinessSales } from '../hooks/useBusinessSales';
import { calculateFinancialMetrics, calculateBusinessSalesTarget } from '../lib/financialMath';
import {
  formatIDR,
  formatCompactIDR,
  formatPercent,
  formatMonthYearIndo,
  getCurrentMonthStart,
  getAvailableMonthOptions,
} from '../lib/formatters';
import { MonthlyEvaluation } from '../types/database';

export const MonthlyReviewPage: React.FC = () => {
  const currentMonth = getCurrentMonthStart();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const monthOptions = getAvailableMonthOptions();

  const { coreDriver } = useNorthStarGoals();
  const { profile } = useLifeProfile();
  const {
    netProfit: liveNetProfit,
    loading: loadingLiveProfit,
    error: profitRpcError,
    refetch: refetchLiveProfit,
  } = useFinancialKuProfit();

  const {
    evaluations,
    loading: loadingEvals,
    error: evalError,
    saveEvaluation,
  } = useMonthlyEvaluations(selectedMonth);

  const { targets: businessTargets } = useBusinessTargets();
  const { monthlyTotals, loading: loadingSales } = useBusinessSales(`${selectedMonth}-01`);

  // Derived current metrics from live settings
  const currentMetrics = calculateFinancialMetrics(coreDriver, profile, liveNetProfit);
  const monthlyNorthStar = currentMetrics.monthlyTarget;

  // Derive business targets
  const jamuTarget = businessTargets.find((t) => t.business_key === 'jamu_herbal');
  const spiritualTarget = businessTargets.find((t) => t.business_key === 'akademi_spiritual');
  const pakarTarget = businessTargets.find((t) => t.business_key === 'pakar_digital');

  const liveJamuCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    jamuTarget?.allocation_percentage ?? 10,
    jamuTarget?.profit_per_unit ?? 10000,
    jamuTarget?.planning_days_per_month ?? 30,
    jamuTarget?.sales_unit ?? 'botol 500 ml',
    'jamu_herbal'
  );

  const liveSpiritualCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    spiritualTarget?.allocation_percentage ?? 50,
    spiritualTarget?.profit_per_unit ?? 10000,
    spiritualTarget?.planning_days_per_month ?? 30,
    spiritualTarget?.sales_unit ?? 'member',
    'akademi_spiritual'
  );

  const livePakarCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    pakarTarget?.allocation_percentage ?? 40,
    pakarTarget?.profit_per_unit ?? 50000,
    pakarTarget?.planning_days_per_month ?? 30,
    pakarTarget?.sales_unit ?? 'produk',
    'pakar_digital'
  );

  // Find existing evaluation for selected month
  const existingEval = evaluations.find((e) => e.month_start === selectedMonth);

  // Form states
  const [offersSent, setOffersSent] = useState<number>(0);
  const [outreachCount, setOutreachCount] = useState<number>(0);
  const [newClients, setNewClients] = useState<number>(0);
  const [totalWorkHours, setTotalWorkHours] = useState<number>(0);
  const [consistentWorkDays, setConsistentWorkDays] = useState<number>(0);
  const [wins, setWins] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [nextMonthAdjustments, setNextMonthAdjustments] = useState('');

  // Snapshot values
  const [snapshotProfit, setSnapshotProfit] = useState<number | null>(null);
  const [snapshotMonthlyTarget, setSnapshotMonthlyTarget] = useState<number | null>(null);
  const [businessTargetSnapshot, setBusinessTargetSnapshot] = useState<any>(null);
  const [businessSalesSnapshot, setBusinessSalesSnapshot] = useState<any>(null);

  // UI state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [unlockConfirmed, setUnlockConfirmed] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Synchronize state when selected month changes or evaluation loads
  useEffect(() => {
    setStatusMessage(null);
    setUnlockConfirmed(false);

    if (existingEval) {
      setOffersSent(existingEval.offers_sent || 0);
      setOutreachCount(existingEval.outreach_count || 0);
      setNewClients(existingEval.new_clients || 0);
      setTotalWorkHours(existingEval.total_work_hours || 0);
      setConsistentWorkDays(existingEval.consistent_work_days || 0);
      setWins(existingEval.wins || '');
      setObstacles(existingEval.obstacles || '');
      setLessonsLearned(existingEval.lessons_learned || '');
      setNextMonthAdjustments(existingEval.next_month_adjustments || '');

      setSnapshotProfit(existingEval.actual_net_profit);
      setSnapshotMonthlyTarget(existingEval.monthly_target);
      setBusinessTargetSnapshot(existingEval.business_target_snapshot || null);
      setBusinessSalesSnapshot(existingEval.business_sales_snapshot || null);
      setIsCompleted(existingEval.status === 'completed');
    } else {
      setOffersSent(0);
      setOutreachCount(0);
      setNewClients(0);
      setTotalWorkHours(0);
      setConsistentWorkDays(0);
      setWins('');
      setObstacles('');
      setLessonsLearned('');
      setNextMonthAdjustments('');

      const isCurrent = selectedMonth === currentMonth;
      setSnapshotProfit(isCurrent ? liveNetProfit : null);
      setSnapshotMonthlyTarget(currentMetrics.monthlyTarget);
      setBusinessTargetSnapshot(null);
      setBusinessSalesSnapshot(null);
      setIsCompleted(false);
    }
  }, [selectedMonth, existingEval, currentMonth, liveNetProfit, currentMetrics.monthlyTarget]);

  const isEditable = !isCompleted || unlockConfirmed;
  const isCurrentActiveMonth = selectedMonth === currentMonth;

  // Refresh live profit for current month
  const handleRefreshLiveProfit = async () => {
    await refetchLiveProfit();
    if (liveNetProfit !== null) {
      setSnapshotProfit(liveNetProfit);
    }
  };

  const getTargetSnapshotToSave = () => {
    return (
      businessTargetSnapshot || {
        jamu_herbal: {
          monthlySalesTarget: liveJamuCalc.monthlySalesTarget,
          dailySalesTarget: liveJamuCalc.dailySalesTarget,
          salesUnit: liveJamuCalc.salesUnit,
          allocationPercentage: liveJamuCalc.allocationPercentage,
          profitPerUnit: liveJamuCalc.profitPerUnit,
        },
        akademi_spiritual: {
          monthlySalesTarget: liveSpiritualCalc.monthlySalesTarget,
          dailySalesTarget: liveSpiritualCalc.dailySalesTarget,
          salesUnit: liveSpiritualCalc.salesUnit,
          allocationPercentage: liveSpiritualCalc.allocationPercentage,
          profitPerUnit: liveSpiritualCalc.profitPerUnit,
        },
        pakar_digital: {
          monthlySalesTarget: livePakarCalc.monthlySalesTarget,
          dailySalesTarget: livePakarCalc.dailySalesTarget,
          salesUnit: livePakarCalc.salesUnit,
          allocationPercentage: livePakarCalc.allocationPercentage,
          profitPerUnit: livePakarCalc.profitPerUnit,
        },
      }
    );
  };

  const getSalesSnapshotToSave = () => {
    return (
      businessSalesSnapshot || {
        jamu_herbal: monthlyTotals['jamu_herbal'] || 0,
        akademi_spiritual: monthlyTotals['akademi_spiritual'] || 0,
        pakar_digital: monthlyTotals['pakar_digital'] || 0,
      }
    );
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setStatusMessage(null);

    const profitToSave = snapshotProfit !== null ? snapshotProfit : isCurrentActiveMonth ? liveNetProfit : null;

    const payload: Partial<MonthlyEvaluation> & { month_start: string } = {
      month_start: selectedMonth,
      north_star_goal_id: existingEval?.north_star_goal_id || coreDriver?.id || null,
      vision_target_amount: existingEval?.vision_target_amount ?? currentMetrics.northStarAmount,
      target_years_snapshot: existingEval?.target_years_snapshot ?? currentMetrics.targetYears,
      annual_target_snapshot: existingEval?.annual_target_snapshot ?? currentMetrics.annualTarget,
      monthly_target: existingEval?.monthly_target ?? currentMetrics.monthlyTarget,
      actual_net_profit: profitToSave,
      financial_net_profit_snapshot: profitToSave,
      business_target_snapshot: getTargetSnapshotToSave(),
      business_sales_snapshot: getSalesSnapshotToSave(),
      offers_sent: offersSent,
      outreach_count: outreachCount,
      new_clients: newClients,
      total_work_hours: totalWorkHours,
      consistent_work_days: consistentWorkDays,
      wins: wins.trim(),
      obstacles: obstacles.trim(),
      lessons_learned: lessonsLearned.trim(),
      next_month_adjustments: nextMonthAdjustments.trim(),
      status: 'draft',
      evaluated_at: existingEval?.evaluated_at || null,
    };

    const res = await saveEvaluation(payload);
    setSaving(false);

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error });
    } else {
      setStatusMessage({
        type: 'success',
        text: 'Draft evaluasi bulanan berhasil disimpan.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleFinalizeEvaluation = async () => {
    const profitToSave = snapshotProfit !== null ? snapshotProfit : isCurrentActiveMonth ? liveNetProfit : null;

    if (profitToSave === null || profitToSave === undefined) {
      if (
        !confirm(
          'Net profit periode ini bernilai Rp 0 atau belum sinkron. Apakah Anda tetap ingin mengunci evaluasi ini?'
        )
      ) {
        return;
      }
    }

    setSaving(true);
    setStatusMessage(null);

    const payload: Partial<MonthlyEvaluation> & { month_start: string } = {
      month_start: selectedMonth,
      north_star_goal_id: existingEval?.north_star_goal_id || coreDriver?.id || null,
      vision_target_amount: existingEval?.vision_target_amount ?? currentMetrics.northStarAmount,
      target_years_snapshot: existingEval?.target_years_snapshot ?? currentMetrics.targetYears,
      annual_target_snapshot: existingEval?.annual_target_snapshot ?? currentMetrics.annualTarget,
      monthly_target: existingEval?.monthly_target ?? currentMetrics.monthlyTarget,
      actual_net_profit: profitToSave ?? 0,
      financial_net_profit_snapshot: profitToSave ?? 0,
      business_target_snapshot: getTargetSnapshotToSave(),
      business_sales_snapshot: getSalesSnapshotToSave(),
      offers_sent: offersSent,
      outreach_count: outreachCount,
      new_clients: newClients,
      total_work_hours: totalWorkHours,
      consistent_work_days: consistentWorkDays,
      wins: wins.trim(),
      obstacles: obstacles.trim(),
      lessons_learned: lessonsLearned.trim(),
      next_month_adjustments: nextMonthAdjustments.trim(),
      status: 'completed',
      evaluated_at: existingEval?.evaluated_at || new Date().toISOString(),
    };

    const res = await saveEvaluation(payload);
    setSaving(false);

    if (res.error) {
      setStatusMessage({ type: 'error', text: res.error });
    } else {
      setIsCompleted(true);
      setUnlockConfirmed(false);
      setStatusMessage({
        type: 'success',
        text: 'Evaluasi bulanan berhasil difinalisasi dan snapshot tersimpan permanen.',
      });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Metrics for display
  const displayTarget = snapshotMonthlyTarget ?? currentMetrics.monthlyTarget;
  const displayActual = snapshotProfit !== null ? snapshotProfit : isCurrentActiveMonth ? liveNetProfit : null;
  const achievementPct =
    displayTarget > 0 && displayActual !== null ? (displayActual / displayTarget) * 100 : null;
  const gap = displayActual !== null ? displayTarget - displayActual : null;

  // 3 Business displays (from snapshot if completed, else live)
  const displayJamuTarget = businessTargetSnapshot?.jamu_herbal?.monthlySalesTarget ?? liveJamuCalc.monthlySalesTarget;
  const displaySpiritualTarget = businessTargetSnapshot?.akademi_spiritual?.monthlySalesTarget ?? liveSpiritualCalc.monthlySalesTarget;
  const displayPakarTarget = businessTargetSnapshot?.pakar_digital?.monthlySalesTarget ?? livePakarCalc.monthlySalesTarget;

  const displayJamuSold = businessSalesSnapshot?.jamu_herbal ?? (monthlyTotals['jamu_herbal'] || 0);
  const displaySpiritualSold = businessSalesSnapshot?.akademi_spiritual ?? (monthlyTotals['akademi_spiritual'] || 0);
  const displayPakarSold = businessSalesSnapshot?.pakar_digital ?? (monthlyTotals['pakar_digital'] || 0);

  const jamuUnitName = businessTargetSnapshot?.jamu_herbal?.salesUnit ?? liveJamuCalc.salesUnit;
  const spiritualUnitName = businessTargetSnapshot?.akademi_spiritual?.salesUnit ?? liveSpiritualCalc.salesUnit;
  const pakarUnitName = businessTargetSnapshot?.pakar_digital?.salesUnit ?? livePakarCalc.salesUnit;

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Month Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E4575] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CalendarCheck2 className="w-7 h-7 text-cyan-400" />
            <span>Monthly Review & Evaluation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluasi berkala bulanan: Realisasi target unit 3 bisnis, Net Profit FinancialKu, dan refleksi strategis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0B2545] px-3.5 py-2 rounded-xl border border-[#1E4575] shadow-sm">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-mono"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#071B35] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {isCompleted && !unlockConfirmed && (
            <button
              onClick={() => setUnlockConfirmed(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B2545] hover:bg-[#15385F] text-slate-200 rounded-xl text-xs font-semibold border border-[#1E4575] transition shadow-sm"
              title="Buka kunci untuk mengedit evaluasi ini"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Kunci</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Top Summary: Financial Net Profit & 3 Business Unit Results */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Kinerja Finansial & Target Unit Penjualan ({formatMonthYearIndo(selectedMonth)})</span>
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-[#0B2545] px-3 py-1 rounded-lg border border-[#1E4575]">
            Status: {isCompleted ? 'Terkunci (Final)' : 'Draft / Berjalan'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: North Star Net Profit Target */}
          <div className="enterprise-card p-5 space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Net Profit Bulanan
            </span>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {formatIDR(displayTarget)}
            </div>
            <p className="text-[11px] text-slate-400">
              Target North Star periode {formatMonthYearIndo(selectedMonth)}
            </p>
          </div>

          {/* Card 2: FinancialKu Realisasi Net Profit */}
          <div className="enterprise-card p-5 space-y-2 relative border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Net Profit FinancialKu
              </span>
              {isCurrentActiveMonth && isEditable && (
                <button
                  onClick={handleRefreshLiveProfit}
                  disabled={loadingLiveProfit}
                  title="Perbarui dari FinancialKu"
                  className="p-1 hover:bg-[#071B35] text-slate-400 hover:text-emerald-400 rounded-lg transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLiveProfit ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
              {displayActual !== null ? formatIDR(displayActual) : '-'}
            </div>
            <p className="text-[11px] text-slate-400">
              {existingEval?.evaluated_at
                ? 'Snapshot tersimpan saat evaluasi dikunci'
                : 'Diambil langsung dari rekening profit FinancialKu'}
            </p>
          </div>

          {/* Card 3: Pencapaian Net Profit */}
          <div className="enterprise-card p-5 space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Pencapaian Net Profit
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold font-mono ${
                  (achievementPct ?? 0) >= 100
                    ? 'text-emerald-400'
                    : (achievementPct ?? 0) >= 50
                    ? 'text-cyan-300'
                    : 'text-amber-400'
                }`}
              >
                {achievementPct !== null ? formatPercent(achievementPct) : '-'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {gap !== null && gap > 0 ? (
                <>
                  Kekurangan: <span className="text-amber-400 font-mono font-bold">{formatIDR(gap)}</span>
                </>
              ) : gap !== null && gap <= 0 ? (
                <span className="text-emerald-400 font-medium">✓ Target terpenuhi</span>
              ) : (
                'Menunggu data finansial'
              )}
            </p>
          </div>

          {/* Card 4: Status Evaluasi */}
          <div className="enterprise-card p-5 space-y-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Status Dokumen
            </span>
            <div className="flex items-center gap-2 pt-1">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Selesai (Terkunci)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Draft Berjalan</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {isCompleted ? 'Snapshot kinerja disimpan permanen.' : 'Dapat diedit dan diperbarui.'}
            </p>
          </div>
        </div>

        {/* 3 Business Unit Sales Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          {/* Jamu Herbal */}
          <div className="p-4 rounded-xl bg-[#0B2545]/90 border border-emerald-500/30 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Jamu Herbal</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {displayJamuTarget > 0
                  ? `${Math.round((displayJamuSold / displayJamuTarget) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Terjual:</span>
              <span className="text-base font-bold text-white font-mono">
                {displayJamuSold} / {displayJamuTarget} <span className="text-xs font-normal text-slate-400">{jamuUnitName}</span>
              </span>
            </div>
            <div className="w-full bg-[#071B35] rounded-full h-2 overflow-hidden border border-[#1E4575]">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, displayJamuTarget > 0 ? (displayJamuSold / displayJamuTarget) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>

          {/* Akademi Spiritual */}
          <div className="p-4 rounded-xl bg-[#0B2545]/90 border border-purple-500/30 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Akademi Spiritual</span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-400">
                {displaySpiritualTarget > 0
                  ? `${Math.round((displaySpiritualSold / displaySpiritualTarget) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Terjual:</span>
              <span className="text-base font-bold text-white font-mono">
                {displaySpiritualSold} / {displaySpiritualTarget} <span className="text-xs font-normal text-slate-400">{spiritualUnitName}</span>
              </span>
            </div>
            <div className="w-full bg-[#071B35] rounded-full h-2 overflow-hidden border border-[#1E4575]">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, displaySpiritualTarget > 0 ? (displaySpiritualSold / displaySpiritualTarget) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>

          {/* Pakar Digital */}
          <div className="p-4 rounded-xl bg-[#0B2545]/90 border border-cyan-500/30 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Pakar Digital</span>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {displayPakarTarget > 0
                  ? `${Math.round((displayPakarSold / displayPakarTarget) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Terjual:</span>
              <span className="text-base font-bold text-white font-mono">
                {displayPakarSold} / {displayPakarTarget} <span className="text-xs font-normal text-slate-400">{pakarUnitName}</span>
              </span>
            </div>
            <div className="w-full bg-[#071B35] rounded-full h-2 overflow-hidden border border-[#1E4575]">
              <div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full"
                style={{
                  width: `${Math.min(100, displayPakarTarget > 0 ? (displayPakarSold / displayPakarTarget) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Review Reflection & Execution Metrics Form */}
      <section className="enterprise-card p-6 shadow-xl space-y-6">
        <div className="pb-4 border-b border-[#1E4575] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              <h3 className="text-base font-bold text-white tracking-tight">Refleksi Eksekusi & Evaluasi Kualitatif</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Identifikasi pencapaian utama, hambatan, serta tindakan korektif untuk bulan selanjutnya.
            </p>
          </div>
          {!isEditable && (
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Mode Hanya Baca</span>
            </span>
          )}
        </div>

        {/* Numeric Execution Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Total Jam Kerja Produktif
            </label>
            <input
              type="number"
              min="0"
              disabled={!isEditable}
              value={totalWorkHours}
              onChange={(e) => setTotalWorkHours(Number(e.target.value))}
              placeholder="Contoh: 120"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs font-mono disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Hari Kerja Konsisten
            </label>
            <input
              type="number"
              min="0"
              max="31"
              disabled={!isEditable}
              value={consistentWorkDays}
              onChange={(e) => setConsistentWorkDays(Number(e.target.value))}
              placeholder="Contoh: 22"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs font-mono disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Total Penawaran / Outreach Terkirim
            </label>
            <input
              type="number"
              min="0"
              disabled={!isEditable}
              value={outreachCount}
              onChange={(e) => setOutreachCount(Number(e.target.value))}
              placeholder="Contoh: 45"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs font-mono disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 4 Reflection Textareas */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>1. Pencapaian Utama (Wins)</span>
            </label>
            <textarea
              rows={3}
              disabled={!isEditable}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="Apa saja kemenangan terbesar yang berhasil dicapai bulan ini dalam eksekusi tiga bisnis?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-400 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>2. Hambatan & Kendala (Obstacles)</span>
            </label>
            <textarea
              rows={3}
              disabled={!isEditable}
              value={obstacles}
              onChange={(e) => setObstacles(e.target.value)}
              placeholder="Apa hambatan internal maupun eksternal yang paling memperlambat penjualan atau eksekusi?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>3. Pembelajaran Berharga (Lessons Learned)</span>
            </label>
            <textarea
              rows={3}
              disabled={!isEditable}
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="Pola apa yang berhasil dan harus dipertahankan? Pola apa yang membuang waktu dan harus dihentikan?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>4. Rencana Penyesuaian Bulan Depan (Next Month Adjustments)</span>
            </label>
            <textarea
              rows={3}
              disabled={!isEditable}
              value={nextMonthAdjustments}
              onChange={(e) => setNextMonthAdjustments(e.target.value)}
              placeholder="Strategi spesifik apa yang akan diubah pada bulan depan untuk mengejar kekurangan target?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs disabled:opacity-50 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Form Action Buttons */}
        {isEditable && (
          <div className="pt-4 border-t border-[#1E4575] flex items-center justify-end gap-3 flex-wrap">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B2545] hover:bg-[#15385F] text-slate-200 text-xs font-semibold border border-[#1E4575] transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Draft</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleFinalizeEvaluation}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalisasi & Kunci Evaluasi</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
