/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  Compass,
  ArrowRight,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Calendar,
  Sparkles,
  Layers,
  Percent,
  Plus,
  X,
  Package,
  Users,
  Laptop,
  Check,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useNorthStarGoals } from '../hooks/useNorthStarGoals';
import { useLifeProfile } from '../hooks/useLifeProfile';
import { useFinancialKuProfit } from '../hooks/useFinancialKuProfit';
import { useBusinessTargets } from '../contexts/BusinessTargetsContext';
import { useExecutionTasks } from '../hooks/useExecutionTasks';
import { calculateFinancialMetrics, calculateBusinessSalesTarget } from '../lib/financialMath';
import { formatIDR, formatCompactIDR } from '../lib/formatters';
import { LifeBusinessTarget, TaskPriority, TaskType } from '../types/database';

export const TargetHierarchyPage: React.FC = () => {
  const { coreDriver, loading: loadingGoals } = useNorthStarGoals();
  const { profile } = useLifeProfile();
  const { netProfit: liveNetProfit } = useFinancialKuProfit();
  const { targets, loading: loadingTargets, updateAllocations, updateTarget } = useBusinessTargets();
  const { createTask, getTodayTasksCount } = useExecutionTasks();

  const metrics = calculateFinancialMetrics(coreDriver, profile, liveNetProfit);
  const monthlyNorthStar = metrics.monthlyTarget;

  // Active targets guaranteed to be the 3 businesses
  const jamuTarget = targets.find((t) => t.business_key === 'jamu_herbal');
  const spiritualTarget = targets.find((t) => t.business_key === 'akademi_spiritual');
  const pakarTarget = targets.find((t) => t.business_key === 'pakar_digital');

  // Allocation editing state
  const [allocJamu, setAllocJamu] = useState<number>(10);
  const [allocSpiritual, setAllocSpiritual] = useState<number>(50);
  const [allocPakar, setAllocPakar] = useState<number>(40);
  const [savingAlloc, setSavingAlloc] = useState(false);
  const [allocSuccessMsg, setAllocSuccessMsg] = useState<string | null>(null);
  const [allocErrorMsg, setAllocErrorMsg] = useState<string | null>(null);

  // Sync allocations when targets load
  useEffect(() => {
    if (jamuTarget?.allocation_percentage !== undefined) setAllocJamu(jamuTarget.allocation_percentage);
    if (spiritualTarget?.allocation_percentage !== undefined) setAllocSpiritual(spiritualTarget.allocation_percentage);
    if (pakarTarget?.allocation_percentage !== undefined) setAllocPakar(pakarTarget.allocation_percentage);
  }, [jamuTarget?.allocation_percentage, spiritualTarget?.allocation_percentage, pakarTarget?.allocation_percentage]);

  const totalAllocation = Number(allocJamu || 0) + Number(allocSpiritual || 0) + Number(allocPakar || 0);
  const isAllocationValid = Math.round(totalAllocation) === 100;

  // Edit Parameter Modal State
  const [paramModalOpen, setParamModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<LifeBusinessTarget | null>(null);
  const [formSalesUnit, setFormSalesUnit] = useState('unit');
  const [formProfitPerUnit, setFormProfitPerUnit] = useState<number>(10000);
  const [formPlanningDays, setFormPlanningDays] = useState<number>(30);
  const [savingParam, setSavingParam] = useState(false);
  const [paramError, setParamError] = useState<string | null>(null);
  const [paramSuccess, setParamSuccess] = useState<string | null>(null);

  // Quick Task Creation Modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskBusinessKey, setTaskBusinessKey] = useState<string>('jamu_herbal');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('lead_measure');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [taskEstDuration, setTaskEstDuration] = useState<number>(60);
  const [savingTask, setSavingTask] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  const openParamModal = (t: LifeBusinessTarget) => {
    setEditingTarget(t);
    setFormSalesUnit(t.sales_unit || 'unit');
    setFormProfitPerUnit(t.profit_per_unit || 10000);
    setFormPlanningDays(t.planning_days_per_month || 30);
    setParamError(null);
    setParamSuccess(null);
    setParamModalOpen(true);
  };

  const handleSaveAllocations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllocationValid) {
      setAllocErrorMsg(`Total alokasi harus tepat 100%. Saat ini: ${totalAllocation}%`);
      return;
    }
    setSavingAlloc(true);
    setAllocSuccessMsg(null);
    setAllocErrorMsg(null);

    const payload = [
      { business_key: 'jamu_herbal', allocation_percentage: Number(allocJamu) },
      { business_key: 'akademi_spiritual', allocation_percentage: Number(allocSpiritual) },
      { business_key: 'pakar_digital', allocation_percentage: Number(allocPakar) },
    ];

    const res = await updateAllocations(payload);
    setSavingAlloc(false);
    if (res.success) {
      setAllocSuccessMsg('Persentase alokasi berhasil diperbarui.');
      setTimeout(() => setAllocSuccessMsg(null), 4000);
    } else {
      setAllocErrorMsg(res.error || 'Gagal menyimpan alokasi.');
    }
  };

  const handleSaveParameters = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    if (formProfitPerUnit <= 0) {
      setParamError('Profit per unit harus lebih besar dari 0.');
      return;
    }
    if (formPlanningDays <= 0 || formPlanningDays > 31) {
      setParamError('Jumlah hari per bulan harus antara 1 sampai 31.');
      return;
    }

    setSavingParam(true);
    setParamError(null);
    setParamSuccess(null);

    const res = await updateTarget(editingTarget.id, {
      sales_unit: formSalesUnit.trim() || 'unit',
      profit_per_unit: Number(formProfitPerUnit),
      planning_days_per_month: Number(formPlanningDays),
    });

    setSavingParam(false);
    if (res.success) {
      setParamSuccess('Parameter produk berhasil diperbarui.');
      setTimeout(() => {
        setParamModalOpen(false);
      }, 1000);
    } else {
      setParamError(res.error || 'Gagal menyimpan parameter.');
    }
  };

  const openQuickTask = (bKey: string, defaultName: string) => {
    setTaskBusinessKey(bKey);
    setTaskTitle(`Follow up lead / prospek penjualan ${defaultName}`);
    setTaskType('lead_measure');
    setTaskPriority('high');
    setTaskEstDuration(60);
    setTaskSuccessMsg(null);
    setTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setSavingTask(true);
    setTaskSuccessMsg(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = getTodayTasksCount(todayStr);
    const targetStatus = todayCount < 3 ? 'today' : 'backlog';

    const res = await createTask({
      title: taskTitle.trim(),
      description: `Task eksekusi penjualan terhubung ke bisnis: ${taskBusinessKey}`,
      status: targetStatus,
      scheduled_date: todayStr,
      priority: taskPriority,
      estimated_minutes: taskEstDuration,
      actual_minutes: 0,
      outreach_count: 0,
      task_type: taskType,
      business_key: taskBusinessKey,
      sort_order: 0,
    });

    setSavingTask(false);
    if (res.success) {
      setTaskSuccessMsg(
        targetStatus === 'today'
          ? 'Task berhasil ditambahkan langsung ke Prioritas Hari Ini (Rule of 3)!'
          : 'Slot hari ini penuh (maks 3 task), task disimpan ke Backlog.'
      );
      setTimeout(() => {
        setTaskModalOpen(false);
      }, 1500);
    }
  };

  // Calculate metrics for each of the 3 businesses
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

  const businessCardsData = [
    {
      key: 'jamu_herbal',
      target: jamuTarget,
      calc: jamuCalc,
      icon: Package,
      theme: 'emerald',
      glowClass: 'glow-emerald',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      btnColor: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/20',
      borderHover: 'hover:border-emerald-500/50',
    },
    {
      key: 'akademi_spiritual',
      target: spiritualTarget,
      calc: spiritualCalc,
      icon: Users,
      theme: 'purple',
      glowClass: 'glow-purple',
      bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      btnColor: 'bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white shadow-purple-500/20',
      borderHover: 'hover:border-purple-500/50',
    },
    {
      key: 'pakar_digital',
      target: pakarTarget,
      calc: pakarCalc,
      icon: Laptop,
      theme: 'cyan',
      glowClass: 'glow-cyan',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      btnColor: 'bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white shadow-cyan-500/20',
      borderHover: 'hover:border-cyan-500/50',
    },
  ];

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* 1. Header Module */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1E4575] pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Layers className="w-4 h-4" />
            <span>Target Hierarchy V2 — Multi-Business Operating System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            BREAKDOWN TARGET NORTH STAR
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Satu-satunya target nominal adalah North Star. Target per bisnis diterjemahkan menjadi volume unit penjualan untuk merealisasikan profit bulanan.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            to="/north-star"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B2545] hover:bg-[#15385F] text-slate-200 hover:text-white text-xs font-semibold border border-[#1E4575] transition shadow-sm"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Atur North Star</span>
          </Link>
          <Link
            to="/execution"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-500/20 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Execution Board</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Card: Target North Star Bulanan (Hero Banner) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2A4D] via-[#103A6B] to-[#0A2240] border border-[#1E4D7E]/70 p-6 sm:p-8 shadow-2xl shadow-black/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-600" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#071B35]/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>SATU-SATUNYA TARGET FINANSIAL NOMINAL</span>
            </div>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
              TARGET NET PROFIT BULANAN (NORTH STAR)
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-mono">
                {formatIDR(monthlyNorthStar)}
              </span>
              <span className="text-cyan-300 text-sm font-semibold">/ bulan</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Target nominal tunggal untuk seluruh operasional. Ketiga bisnis di bawah ini bertanggung jawab menghasilkan volume penjualan sesuai porsi alokasi masing-masing.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#071B35]/85 p-4 rounded-xl border border-[#1E4575] shrink-0">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Core Driver</div>
              <div className="text-sm font-bold text-white truncate max-w-[140px]" title={coreDriver?.title}>
                {coreDriver?.title || 'Belum diatur'}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Total Visi</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">
                {formatCompactIDR(metrics.northStarAmount)}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Periode</div>
              <div className="text-sm font-bold text-slate-200 font-mono">
                {metrics.targetYears} Tahun
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Three Business Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full" />
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Target Penjualan Tiga Bisnis</span>
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-[#0B2545] px-3 py-1 rounded-lg border border-[#1E4575]">
            Dihitung otomatis dari North Star
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {businessCardsData.map(({ key, target, calc, icon: Icon, bgColor, badgeColor, btnColor, borderHover }) => {
            const bName =
              target?.business_name ||
              (key === 'jamu_herbal'
                ? 'Jamu Herbal'
                : key === 'akademi_spiritual'
                ? 'Akademi Spiritual'
                : 'Pakar Digital');

            return (
              <div
                key={key}
                className={`enterprise-card p-6 flex flex-col justify-between ${borderHover} transition-all relative group shadow-lg`}
              >
                <div>
                  {/* Top Badge & Header */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl border ${bgColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">
                          {bName}
                        </h3>
                        <span className="text-[11px] text-slate-400 capitalize">
                          Unit: {calc.salesUnit}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
                      {calc.allocationPercentage}% Alokasi
                    </span>
                  </div>

                  {/* Monthly Sales Target Display */}
                  <div className="bg-[#0B2545]/90 rounded-xl p-4 border border-[#193F6C] mb-3.5 space-y-1">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      TARGET PENJUALAN BULANAN
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {calc.monthlySalesTarget.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs font-bold text-cyan-300 uppercase">
                        {calc.salesUnit} / bulan
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Kontribusi Profit: <strong className="text-white font-mono">{formatIDR(calc.monthlyAllocationAmount)}</strong>
                    </div>
                  </div>

                  {/* Daily Speed Target Display */}
                  <div className="bg-[#071B35]/70 rounded-xl p-3.5 border border-[#1E4575] mb-4 space-y-0.5">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      TARGET KECEPATAN HARIAN
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-extrabold text-amber-400 font-mono">
                        {calc.dailySalesTarget.toLocaleString('id-ID')}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 uppercase">
                        {calc.salesUnit} / hari
                      </span>
                    </div>
                  </div>

                  {/* Profit & Days Info */}
                  <div className="space-y-1.5 text-xs text-slate-400 pb-4 border-b border-[#1E4575]/70">
                    <div className="flex justify-between">
                      <span>Asumsi Profit per Unit:</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {formatIDR(calc.profitPerUnit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hari Perencanaan:</span>
                      <span className="text-slate-200 font-mono font-medium">
                        {calc.planningDaysPerMonth} hari / bulan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => target && openParamModal(target)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B2545] hover:bg-[#15385F] text-slate-200 hover:text-white text-xs font-semibold border border-[#1E4575] transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Parameter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openQuickTask(key, bName)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition ${btnColor}`}
                    title="Buat Task di Execution Board"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Task</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Small explanation footer */}
        <div className="p-4 rounded-xl bg-[#0B2545]/70 border border-[#1E4575] text-xs text-slate-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Seluruh target penjualan dihitung otomatis dari North Star, persentase kontribusi bisnis, dan profit bersih per unit. Target harian adalah panduan ritme kerja harian. Satuan unit fisik (botol, member, produk) tidak dapat dijumlahkan menjadi satu angka tunggal karena memiliki wujud dan valuasi berbeda.
          </p>
        </div>
      </div>

      {/* 4. Form Pengaturan Alokasi Kontribusi Bisnis */}
      <div className="enterprise-card p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-[#1E4575]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Alokasi Kontribusi Tiga Bisnis</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Tentukan porsi tanggung jawab pencapaian North Star dari setiap bisnis. Total alokasi ketiga bisnis harus tepat 100%.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                isAllocationValid
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {isAllocationValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Total: 100% (Valid)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Total: {totalAllocation}% (Harus 100%)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {allocSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{allocSuccessMsg}</span>
          </div>
        )}
        {allocErrorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{allocErrorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveAllocations} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Jamu Herbal Alokasi */}
            <div className="p-4 rounded-xl bg-[#0B2545]/90 border border-[#193F6C] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Jamu Herbal</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{allocJamu}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocJamu}
                onChange={(e) => setAllocJamu(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-[#071B35] rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Porsi Persentase:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={allocJamu}
                    onChange={(e) => setAllocJamu(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-[#071B35] border border-[#1E4575] rounded-lg text-right text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {/* Akademi Spiritual Alokasi */}
            <div className="p-4 rounded-xl bg-[#0B2545]/90 border border-[#193F6C] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Akademi Spiritual</span>
                <span className="text-sm font-bold text-purple-400 font-mono">{allocSpiritual}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocSpiritual}
                onChange={(e) => setAllocSpiritual(Number(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-[#071B35] rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Porsi Persentase:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={allocSpiritual}
                    onChange={(e) => setAllocSpiritual(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-[#071B35] border border-[#1E4575] rounded-lg text-right text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>

            {/* Pakar Digital Alokasi */}
            <div className="p-4 rounded-xl bg-[#0B2545]/90 border border-[#193F6C] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Pakar Digital</span>
                <span className="text-sm font-bold text-cyan-400 font-mono">{allocPakar}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={allocPakar}
                onChange={(e) => setAllocPakar(Number(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-[#071B35] rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Porsi Persentase:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={allocPakar}
                    onChange={(e) => setAllocPakar(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-[#071B35] border border-[#1E4575] rounded-lg text-right text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isAllocationValid || savingAlloc}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition shadow-lg shadow-blue-500/20"
            >
              {savingAlloc ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan Alokasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan Alokasi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 5. Parameter Edit Modal */}
      {paramModalOpen && editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#102D50] border border-[#1E4575] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E4575]">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Edit Parameter Produk: {editingTarget.business_name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ubah satuan penjualan, asumsi profit per unit, dan hari perencanaan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParamModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0B2545]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paramError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {paramError}
              </div>
            )}
            {paramSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {paramSuccess}
              </div>
            )}

            <form onSubmit={handleSaveParameters} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Satuan Penjualan
                </label>
                <input
                  type="text"
                  required
                  value={formSalesUnit}
                  onChange={(e) => setFormSalesUnit(e.target.value)}
                  placeholder="Contoh: botol 500 ml, member, produk, paket"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Profit Bersih per Unit (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formProfitPerUnit}
                  onChange={(e) => setFormProfitPerUnit(Number(e.target.value))}
                  placeholder="Contoh: 10000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nilai profit bersih setelah dipotong HPP dan biaya langsung operasional.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hari Perencanaan per Bulan
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={formPlanningDays}
                  onChange={(e) => setFormPlanningDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Standar 30 hari untuk pembagi kecepatan target harian.
                </span>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-4 rounded-xl bg-[#071B35] border border-[#1E4575] space-y-2">
                <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Hasil Simulasi Target Penjualan
                </div>
                {(() => {
                  const sim = calculateBusinessSalesTarget(
                    monthlyNorthStar,
                    editingTarget.allocation_percentage ?? 10,
                    formProfitPerUnit,
                    formPlanningDays,
                    formSalesUnit
                  );
                  return (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#0B2545] p-2.5 rounded-lg border border-[#1E4575]">
                        <span className="text-slate-400 block text-[11px]">Target Bulanan</span>
                        <span className="text-sm font-bold text-white font-mono">
                          {sim.monthlySalesTarget.toLocaleString('id-ID')} {formSalesUnit}
                        </span>
                      </div>
                      <div className="bg-[#0B2545] p-2.5 rounded-lg border border-[#1E4575]">
                        <span className="text-slate-400 block text-[11px]">Kecepatan Harian</span>
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          {sim.dailySalesTarget.toLocaleString('id-ID')} {formSalesUnit}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setParamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#15385F] text-slate-300 text-xs font-semibold transition border border-[#1E4575]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingParam}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
                >
                  {savingParam ? 'Menyimpan...' : 'Simpan Parameter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Quick Task Creation Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#102D50] border border-[#1E4575] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E4575]">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Buat Task Eksekusi untuk Bisnis
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Task ini akan otomatis ditandai sesuai bisnis terkait di Execution Board.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#0B2545]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{taskSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Bisnis Terkait
                </label>
                <select
                  value={taskBusinessKey}
                  onChange={(e) => setTaskBusinessKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="jamu_herbal">Jamu Herbal</option>
                  <option value="akademi_spiritual">Akademi Spiritual</option>
                  <option value="pakar_digital">Pakar Digital</option>
                  <option value="general">Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Judul Task (Aktivitas Lead Measure)
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Misal: Kirim penawaran paket 5 botol ke 10 pelanggan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prioritas
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="high">Tinggi (High)</option>
                    <option value="medium">Sedang (Medium)</option>
                    <option value="low">Rendah (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimasi Waktu (menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={taskEstDuration}
                    onChange={(e) => setTaskEstDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#071B35] border border-[#1E4575] text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#0B2545] hover:bg-[#15385F] text-slate-300 text-xs font-semibold transition border border-[#1E4575]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
                >
                  {savingTask ? 'Menyimpan...' : 'Tambahkan ke Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
