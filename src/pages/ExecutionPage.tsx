/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  KanbanSquare,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronRight,
  Flame,
  AlertTriangle,
  Package,
  Users,
  Laptop,
  Layers,
  Save,
  Check,
  Filter,
  Play,
  CheckSquare,
  Repeat,
} from 'lucide-react';
import { useExecutionTasks } from '../hooks/useExecutionTasks';
import { useLifeProfile } from '../hooks/useLifeProfile';
import { useNorthStarGoals } from '../hooks/useNorthStarGoals';
import { useBusinessTargets } from '../contexts/BusinessTargetsContext';
import { useBusinessSales } from '../hooks/useBusinessSales';
import { calculateFinancialMetrics, calculateBusinessSalesTarget } from '../lib/financialMath';
import { ExecutionTask, TaskPriority, TaskStatus, TaskType } from '../types/database';
import { RecurringScheduleModal } from '../components/execution/RecurringScheduleModal';

/**
 * Format timestamp into 24-hour HH:mm (e.g. 12:30)
 */
function formatTime24h(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace('.', ':');
}

/**
 * Format deadline timestamp: if crosses midnight from started_at, includes day & month
 */
function formatDeadlineDisplay(
  startedAtStr: string | null | undefined,
  deadlineAtStr: string | null | undefined
): string {
  if (!deadlineAtStr) return '-';
  const deadline = new Date(deadlineAtStr);
  if (isNaN(deadline.getTime())) return '-';

  const timeFormatted = deadline.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace('.', ':');

  if (startedAtStr) {
    const start = new Date(startedAtStr);
    if (!isNaN(start.getTime())) {
      const isCrossMidnight =
        start.getDate() !== deadline.getDate() ||
        start.getMonth() !== deadline.getMonth() ||
        start.getFullYear() !== deadline.getFullYear();

      if (isCrossMidnight) {
        const dayMonth = deadline.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        return `${dayMonth}, ${timeFormatted}`;
      }
    }
  }

  return timeFormatted;
}

export interface LiveCountdownResult {
  remainingSeconds: number;
  formattedTime: string;
  isOverdue: boolean;
  statusLabel: string;
  theme: {
    textColor: string;
    bgBox: string;
    borderBox: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    dotColor: string;
  };
  hasDeadline: boolean;
}

/**
 * Hitung mundur waktu pengerjaan secara real-time berdasarkan deadline_at:
 * Rumus:
 * remainingSeconds = Math.max(0, Math.floor((new Date(deadline_at).getTime() - Date.now()) / 1000))
 */
function computeLiveCountdown(
  deadlineAt: string | null | undefined,
  nowMs: number = Date.now()
): LiveCountdownResult {
  if (!deadlineAt) {
    return {
      remainingSeconds: 0,
      formattedTime: '--:--',
      isOverdue: false,
      statusLabel: 'Timer belum tersedia',
      theme: {
        textColor: 'text-slate-400',
        bgBox: 'bg-[#071B35]/70',
        borderBox: 'border-[#1E4575]',
        badgeBg: 'bg-[#0B2545]',
        badgeText: 'text-slate-400',
        badgeBorder: 'border-[#1E4575]',
        dotColor: 'bg-slate-500',
      },
      hasDeadline: false,
    };
  }

  const deadlineMs = new Date(deadlineAt).getTime();
  if (isNaN(deadlineMs)) {
    return {
      remainingSeconds: 0,
      formattedTime: '--:--',
      isOverdue: false,
      statusLabel: 'Format waktu tidak valid',
      theme: {
        textColor: 'text-slate-400',
        bgBox: 'bg-[#071B35]/70',
        borderBox: 'border-[#1E4575]',
        badgeBg: 'bg-[#0B2545]',
        badgeText: 'text-slate-400',
        badgeBorder: 'border-[#1E4575]',
        dotColor: 'bg-slate-500',
      },
      hasDeadline: false,
    };
  }

  const remainingSeconds = Math.max(0, Math.floor((deadlineMs - nowMs) / 1000));
  const isOverdue = deadlineMs <= nowMs;

  let formattedTime = '00:00';
  if (isOverdue) {
    formattedTime = '00:00';
  } else {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    if (hours > 0) {
      formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  }

  if (isOverdue) {
    return {
      remainingSeconds: 0,
      formattedTime: '00:00',
      isOverdue: true,
      statusLabel: 'TERLAMBAT',
      theme: {
        textColor: 'text-rose-400',
        bgBox: 'bg-rose-950/30',
        borderBox: 'border-rose-500/50 shadow-rose-950/20 shadow-md',
        badgeBg: 'bg-rose-500/20',
        badgeText: 'text-rose-300 font-extrabold',
        badgeBorder: 'border-rose-500/50',
        dotColor: 'bg-rose-500',
      },
      hasDeadline: true,
    };
  }

  if (remainingSeconds < 60) {
    return {
      remainingSeconds,
      formattedTime,
      isOverdue: false,
      statusLabel: '< 1 MENIT',
      theme: {
        textColor: 'text-rose-400',
        bgBox: 'bg-rose-950/25',
        borderBox: 'border-rose-500/40',
        badgeBg: 'bg-rose-500/20',
        badgeText: 'text-rose-300 font-bold',
        badgeBorder: 'border-rose-500/40 animate-pulse',
        dotColor: 'bg-rose-400 animate-ping',
      },
      hasDeadline: true,
    };
  }

  if (remainingSeconds <= 300) {
    return {
      remainingSeconds,
      formattedTime,
      isOverdue: false,
      statusLabel: 'KRITIS (1-5 MNT)',
      theme: {
        textColor: 'text-amber-400',
        bgBox: 'bg-amber-950/20',
        borderBox: 'border-amber-500/35',
        badgeBg: 'bg-amber-500/20',
        badgeText: 'text-amber-300 font-semibold',
        badgeBorder: 'border-amber-500/40',
        dotColor: 'bg-amber-400',
      },
      hasDeadline: true,
    };
  }

  return {
    remainingSeconds,
    formattedTime,
    isOverdue: false,
    statusLabel: 'TEPAT WAKTU',
    theme: {
      textColor: 'text-emerald-400',
      bgBox: 'bg-emerald-950/20',
      borderBox: 'border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300 font-semibold',
      badgeBorder: 'border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    hasDeadline: true,
  };
}

const COLUMNS: { id: TaskStatus; title: string; subtitle: string; limit?: number }[] = [
  { id: 'backlog', title: 'Backlog', subtitle: 'Gudang ide & tugas tertunda' },
  { id: 'today', title: 'Prioritas Hari Ini', subtitle: 'Rule of 3 (Maksimal 3 Tugas)', limit: 3 },
  { id: 'in_progress', title: 'Sedang Berjalan', subtitle: 'Fokus pengerjaan live timer' },
  { id: 'done', title: 'Selesai', subtitle: 'Aktivitas tuntas terevaluasi' },
];

const LEAD_MEASURE_TEMPLATES = [
  {
    business_key: 'jamu_herbal',
    title: 'Kirim broadcast penawaran paket 5 botol ke 15 pelanggan lama',
    task_type: 'lead_measure' as TaskType,
    priority: 'high' as TaskPriority,
    estimated_duration: 45,
    outreach_count: 15,
  },
  {
    business_key: 'jamu_herbal',
    title: 'Follow-up reseller aktif untuk restock stok mingguan',
    task_type: 'lead_measure' as TaskType,
    priority: 'high' as TaskPriority,
    estimated_duration: 30,
    outreach_count: 5,
  },
  {
    business_key: 'akademi_spiritual',
    title: 'Kirim link pendaftaran webinar edukasi ke 20 prospek baru',
    task_type: 'lead_measure' as TaskType,
    priority: 'high' as TaskPriority,
    estimated_duration: 60,
    outreach_count: 20,
  },
  {
    business_key: 'akademi_spiritual',
    title: 'Kirim pesan konsultasi personal via DM ke 10 audiens aktif',
    task_type: 'lead_measure' as TaskType,
    priority: 'medium' as TaskPriority,
    estimated_duration: 40,
    outreach_count: 10,
  },
  {
    business_key: 'pakar_digital',
    title: 'Jalankan kampanye email sales flash sale produk digital',
    task_type: 'lead_measure' as TaskType,
    priority: 'high' as TaskPriority,
    estimated_duration: 45,
    outreach_count: 50,
  },
  {
    business_key: 'pakar_digital',
    title: 'Posting konten edukasi carousel dengan CTA ke checkout link',
    task_type: 'lead_measure' as TaskType,
    priority: 'medium' as TaskPriority,
    estimated_duration: 60,
    outreach_count: 0,
  },
];

export const ExecutionPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const {
    tasks,
    loading: loadingTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTaskStatus,
    startTask,
    completeTask,
    getActiveTasksCount,
    getTodayTasksCount,
    generateRecurringTasks,
  } = useExecutionTasks(selectedDate);

  const [recurringModalOpen, setRecurringModalOpen] = useState(false);

  // Automatic recurring task generation on page load (Asia/Jakarta timezone with 7-day lookback)
  const generatorRanRef = React.useRef(false);
  useEffect(() => {
    if (generatorRanRef.current) return;
    generatorRanRef.current = true;
    generateRecurringTasks().catch((err) => {
      console.warn('Auto recurring tasks generation:', err);
    });
  }, [generateRecurringTasks]);

  const { profile } = useLifeProfile();
  const { coreDriver } = useNorthStarGoals();
  const { targets: businessTargets } = useBusinessTargets();
  const { todaySales, recordDailySale } = useBusinessSales(selectedDate);

  const metrics = calculateFinancialMetrics(coreDriver, profile, 0);
  const monthlyNorthStar = metrics.monthlyTarget;

  // Business target calculations for sales inputs
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

  // Local state for daily sales inputs
  const [jamuUnits, setJamuUnits] = useState<number>(0);
  const [spiritualUnits, setSpiritualUnits] = useState<number>(0);
  const [pakarUnits, setPakarUnits] = useState<number>(0);
  const [savingSalesKey, setSavingSalesKey] = useState<string | null>(null);
  const [salesSuccessMsg, setSalesSuccessMsg] = useState<string | null>(null);

  // Sync sales inputs when date or data changes
  useEffect(() => {
    setJamuUnits(todaySales['jamu_herbal']?.units_sold ?? 0);
    setSpiritualUnits(todaySales['akademi_spiritual']?.units_sold ?? 0);
    setPakarUnits(todaySales['pakar_digital']?.units_sold ?? 0);
  }, [todaySales]);

  const handleSaveDailySale = async (bKey: string, units: number, unitLabel: string, profit: number) => {
    setSavingSalesKey(bKey);
    setSalesSuccessMsg(null);
    const res = await recordDailySale(bKey, units, '', unitLabel, profit, selectedDate);
    setSavingSalesKey(null);
    if (res.success) {
      setSalesSuccessMsg(`Penjualan ${bKey} berhasil disimpan!`);
      setTimeout(() => setSalesSuccessMsg(null), 3000);
    }
  };

  const getSalesStatusBadge = (actual: number, target: number) => {
    if (actual <= 0) {
      return {
        label: 'Belum diinput',
        color: 'bg-[#071B35] text-slate-400 border-[#1E4575]',
      };
    }
    if (actual < target) {
      return {
        label: 'Sedang berjalan',
        color: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      };
    }
    if (actual === target) {
      return {
        label: 'Tercapai',
        color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      };
    }
    return {
      label: 'Melampaui target',
      color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    };
  };

  // Filter tasks by business key
  const [filterBusiness, setFilterBusiness] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filterBusiness === 'all') return true;
    if (filterBusiness === 'general') return !t.business_key || t.business_key === 'general';
    return t.business_key === filterBusiness;
  });

  // Modal and form states
  const [validationAlert, setValidationAlert] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ExecutionTask | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('backlog');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskType>('lead_measure');
  const [taskBusinessKey, setTaskBusinessKey] = useState<string>('general');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [actualMinutes, setActualMinutes] = useState<number>(0);
  const [outreachCount, setOutreachCount] = useState<number>(0);
  const [scheduledDate, setScheduledDate] = useState<string>(selectedDate);

  // Live timer & action states
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Keep live deadline countdowns reactive every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleStartTask = async (task: ExecutionTask) => {
    const est = Number(task.estimated_minutes ?? task.estimated_duration ?? 0);
    if (!est || est <= 0) {
      setValidationAlert(
        'Estimasi durasi belum diisi atau bernilai 0 menit. Silakan klik ikon edit (pensil) pada kartu tugas dan tentukan estimasi durasi terlebih dahulu sebelum mulai mengerjakan.'
      );
      return;
    }

    setStartingTaskId(task.id);
    setValidationAlert(null);

    const res = await startTask(task.id);
    setStartingTaskId(null);

    if (res.error) {
      setValidationAlert(res.error);
    }
  };

  const handleCompleteTask = async (task: ExecutionTask) => {
    setCompletingTaskId(task.id);
    setValidationAlert(null);

    const res = await completeTask(task.id);
    setCompletingTaskId(null);

    if (res.error) {
      setValidationAlert(res.error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const openCreateModal = (defaultStatus: TaskStatus = 'backlog') => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setStatus(defaultStatus);
    setPriority('medium');
    setTaskType('lead_measure');
    setTaskBusinessKey(filterBusiness !== 'all' ? filterBusiness : 'jamu_herbal');
    setEstimatedMinutes(30);
    setActualMinutes(0);
    setOutreachCount(defaultStatus === 'today' ? profile?.daily_outreach_target || 10 : 0);
    setScheduledDate(selectedDate);
    setValidationAlert(null);
    setModalOpen(true);
  };

  const openEditModal = (task: ExecutionTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setTaskType(task.task_type);
    setTaskBusinessKey(task.business_key || 'general');
    setEstimatedMinutes(task.estimated_minutes ?? task.estimated_duration ?? 30);
    setActualMinutes(task.actual_minutes ?? task.actual_duration ?? 0);
    setOutreachCount(task.outreach_count || 0);
    setScheduledDate(task.scheduled_date || selectedDate);
    setValidationAlert(null);
    setModalOpen(true);
  };

  const handleApplyTemplate = async (tmpl: typeof LEAD_MEASURE_TEMPLATES[0]) => {
    setValidationAlert(null);
    const res = await createTask({
      title: tmpl.title,
      description: 'Aktivitas Lead Measure terfokus untuk mendukung target unit',
      status: 'backlog',
      priority: tmpl.priority,
      task_type: tmpl.task_type,
      business_key: tmpl.business_key,
      estimated_minutes: tmpl.estimated_duration,
      actual_minutes: 0,
      outreach_count: tmpl.outreach_count,
      scheduled_date: selectedDate,
      sort_order: tasks.length,
    });

    if (res.error) {
      setValidationAlert(res.error);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationAlert('Judul tugas wajib diisi.');
      return;
    }

    setSaving(true);
    setValidationAlert(null);

    if (editingTask) {
      const res = await updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        task_type: taskType,
        business_key: taskBusinessKey,
        estimated_minutes: Number(estimatedMinutes),
        actual_minutes: Number(actualMinutes),
        outreach_count: Number(outreachCount),
        scheduled_date: scheduledDate,
      });

      setSaving(false);
      if (res.error) {
        setValidationAlert(res.error);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await createTask({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        task_type: taskType,
        business_key: taskBusinessKey,
        estimated_minutes: Number(estimatedMinutes),
        actual_minutes: Number(actualMinutes),
        outreach_count: Number(outreachCount),
        scheduled_date: scheduledDate,
        sort_order: tasks.length,
      });

      setSaving(false);
      if (res.error) {
        setValidationAlert(res.error);
      } else {
        setModalOpen(false);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    const targetColumn = COLUMNS.find((col) => col.id === overId)?.id;
    if (targetColumn) {
      const currentTask = tasks.find((t) => t.id === taskId);
      if (currentTask && currentTask.status !== targetColumn) {
        const res = await moveTaskStatus(taskId, targetColumn);
        if (res.error) {
          setValidationAlert(res.error);
        }
      }
    }
  };

  const activeTodayCount = getActiveTasksCount(selectedDate);
  const todayCount = activeTodayCount;

  const getBusinessBadge = (bKey?: string) => {
    switch (bKey) {
      case 'jamu_herbal':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Jamu Herbal
          </span>
        );
      case 'akademi_spiritual':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Akademi Spiritual
          </span>
        );
      case 'pakar_digital':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Pakar Digital
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#071B35] text-slate-400 border border-[#1E4575]">
            Umum
          </span>
        );
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Date Controller */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E4575] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <KanbanSquare className="w-7 h-7 text-cyan-400" />
            <span>Execution Board & Sales Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau hasil penjualan harian (Lag Measures) dan eksekusi tindakan prioritas terarah (Lead Measures).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-[#0B2545] px-3.5 py-2 rounded-xl border border-[#1E4575] shadow-sm">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-mono"
            />
          </div>
          <button
            onClick={() => setRecurringModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#0B2545] hover:bg-[#15385F] text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 rounded-xl text-xs font-semibold shadow-sm transition"
            title="Kelola jadwal template rutinitas mingguan promosi konten 3 bisnis"
          >
            <Repeat className="w-4 h-4 text-cyan-400" />
            <span>Kelola Jadwal Berulang</span>
          </button>
          <button
            onClick={() => openCreateModal('today')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Task</span>
          </button>
        </div>
      </div>

      {salesSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{salesSuccessMsg}</span>
        </div>
      )}

      {/* 2. TOP SECTION: TARGET PENJUALAN HARI INI (Lag Measures) */}
      <section className="enterprise-card p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E4575]">
          <div>
            <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Package className="w-3.5 h-3.5" />
              <span>Lag Measures — Hasil Nyata Penjualan</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              TARGET PENJUALAN HARI INI
            </h2>
            <p className="text-xs text-slate-400">
              Input unit riil yang terjual pada tanggal yang dipilih. Data disimpan langsung ke riwayat penjualan di Supabase.
            </p>
          </div>
          <span className="text-xs text-slate-300 font-mono bg-[#071B35] px-3 py-1 rounded-lg border border-[#1E4575]">
            Tanggal: {selectedDate}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
          {/* Tracker 1: Jamu Herbal */}
          {(() => {
            const statusBadge = getSalesStatusBadge(jamuUnits, jamuCalc.dailySalesTarget);
            return (
              <div className="bg-[#0B2545]/90 border border-emerald-500/30 rounded-xl p-5 space-y-4 relative hover:border-emerald-400/50 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="font-bold text-white text-sm">Jamu Herbal</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Target Hari Ini:</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">
                    {jamuCalc.dailySalesTarget} {jamuCalc.salesUnit}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Unit Terjual Hari Ini:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={jamuUnits}
                      onChange={(e) => setJamuUnits(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={savingSalesKey === 'jamu_herbal'}
                      onClick={() =>
                        handleSaveDailySale(
                          'jamu_herbal',
                          jamuUnits,
                          jamuCalc.salesUnit,
                          jamuCalc.profitPerUnit
                        )
                      }
                      className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                      title="Simpan Penjualan Jamu Herbal"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSalesKey === 'jamu_herbal' ? '...' : 'Simpan'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tracker 2: Akademi Spiritual */}
          {(() => {
            const statusBadge = getSalesStatusBadge(spiritualUnits, spiritualCalc.dailySalesTarget);
            return (
              <div className="bg-[#0B2545]/90 border border-purple-500/30 rounded-xl p-5 space-y-4 relative hover:border-purple-400/50 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                    <span className="font-bold text-white text-sm">Akademi Spiritual</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Target Hari Ini:</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">
                    {spiritualCalc.dailySalesTarget} {spiritualCalc.salesUnit}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Unit Terjual Hari Ini:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={spiritualUnits}
                      onChange={(e) => setSpiritualUnits(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      disabled={savingSalesKey === 'akademi_spiritual'}
                      onClick={() =>
                        handleSaveDailySale(
                          'akademi_spiritual',
                          spiritualUnits,
                          spiritualCalc.salesUnit,
                          spiritualCalc.profitPerUnit
                        )
                      }
                      className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                      title="Simpan Penjualan Akademi Spiritual"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSalesKey === 'akademi_spiritual' ? '...' : 'Simpan'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tracker 3: Pakar Digital */}
          {(() => {
            const statusBadge = getSalesStatusBadge(pakarUnits, pakarCalc.dailySalesTarget);
            return (
              <div className="bg-[#0B2545]/90 border border-cyan-500/30 rounded-xl p-5 space-y-4 relative hover:border-cyan-400/50 transition-all shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    <span className="font-bold text-white text-sm">Pakar Digital</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Target Hari Ini:</span>
                  <span className="text-base font-extrabold text-amber-400 font-mono">
                    {pakarCalc.dailySalesTarget} {pakarCalc.salesUnit}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Unit Terjual Hari Ini:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={pakarUnits}
                      onChange={(e) => setPakarUnits(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      disabled={savingSalesKey === 'pakar_digital'}
                      onClick={() =>
                        handleSaveDailySale(
                          'pakar_digital',
                          pakarUnits,
                          pakarCalc.salesUnit,
                          pakarCalc.profitPerUnit
                        )
                      }
                      className="px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                      title="Simpan Penjualan Pakar Digital"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSalesKey === 'pakar_digital' ? '...' : 'Simpan'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 3. Quick Lead Measure Templates for 3 Businesses */}
      <section className="enterprise-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Template Cepat Lead Measures (Aktivitas Pendorong Penjualan)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Klik untuk memasukkan ke Backlog
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEAD_MEASURE_TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="p-3.5 text-left rounded-xl bg-[#0B2545]/80 hover:bg-[#15385F] border border-[#1E4575] hover:border-cyan-500/40 text-xs text-slate-300 transition group flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  {getBusinessBadge(tmpl.business_key)}
                  <span className="text-[10px] text-slate-400 font-mono">{tmpl.estimated_duration} mnt</span>
                </div>
                <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {tmpl.title}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2.5 flex items-center justify-between">
                <span>Outreach: {tmpl.outreach_count} kontak</span>
                <span className="text-cyan-400 group-hover:underline font-semibold">+ Tambah</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Kanban Section: Filter & Board */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Filter Bisnis:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'jamu_herbal', label: 'Jamu Herbal' },
                { id: 'akademi_spiritual', label: 'Akademi Spiritual' },
                { id: 'pakar_digital', label: 'Pakar Digital' },
                { id: 'general', label: 'Umum' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterBusiness(btn.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl transition ${
                    filterBusiness === btn.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-md shadow-cyan-500/20'
                      : 'bg-[#0B2545] hover:bg-[#15385F] text-slate-300 hover:text-white border border-[#1E4575]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Total Task Tampil: <strong className="text-white font-mono">{filteredTasks.length}</strong>
          </div>
        </div>

        {validationAlert && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationAlert}</span>
          </div>
        )}

        {/* 4 Columns Board */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map((column) => {
              const colTasks = filteredTasks.filter((t) => t.status === column.id);
              const isTodayCol = column.id === 'today';
              const isAtLimit = isTodayCol && activeTodayCount >= 3;

              return (
                <div
                  key={column.id}
                  id={column.id}
                  className="bg-[#0B2545]/90 border border-[#193F6C] rounded-2xl p-4 flex flex-col min-h-[520px] shadow-lg"
                >
                  {/* Column Header */}
                  <div className="pb-3 border-b border-[#1E4575] mb-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{column.title}</span>
                        {isTodayCol && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                              activeTodayCount >= 3
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                            title="Rule of 3: Batas maksimal 3 tugas aktif (Prioritas Hari Ini + Sedang Berjalan)"
                          >
                            Fokus: {activeTodayCount}/3
                          </span>
                        )}
                      </h4>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#071B35] border border-[#1E4575] rounded text-cyan-300">
                        {colTasks.length}
                        {column.limit ? `/${column.limit}` : ''}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{column.subtitle}</p>
                  </div>

                  {/* Add button inside column */}
                  <button
                    onClick={() => openCreateModal(column.id)}
                    disabled={isAtLimit}
                    className="w-full mb-3 py-2 rounded-xl border border-dashed border-[#1E4575] hover:border-cyan-500 hover:bg-cyan-500/10 text-xs font-semibold text-slate-300 hover:text-cyan-300 transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:border-[#1E4575] disabled:hover:bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAtLimit ? 'Kapasitas Fokus Penuh (3/3)' : 'Tambah Task'}</span>
                  </button>

                  {/* Task List */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex items-center justify-center border border-dashed border-[#1E4575]/60 rounded-xl text-[11px] text-slate-500">
                        Kosong
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isToday = task.status === 'today';
                        const isInProgress = task.status === 'in_progress';
                        const isDone = task.status === 'done';
                        const isBacklog = task.status === 'backlog';
                        const countdown = computeLiveCountdown(task.deadline_at, currentTime);

                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl space-y-2.5 transition shadow-sm group ${
                              isInProgress
                                ? 'bg-[#0E2F54] border border-cyan-500/60 ring-1 ring-cyan-500/30'
                                : 'bg-[#102D50] border border-[#1E4575] hover:border-cyan-500/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {getBusinessBadge(task.business_key)}
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase font-mono ${
                                    task.task_type === 'lead_measure'
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-[#071B35] text-slate-300 border border-[#1E4575]'
                                  }`}
                                >
                                  {task.task_type === 'lead_measure' ? 'Lead' : 'Support'}
                                </span>
                                {task.priority === 'high' && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
                                    High
                                  </span>
                                )}
                                {task.priority === 'low' && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase font-mono bg-[#071B35] text-slate-400 border border-[#1E4575]">
                                    Low
                                  </span>
                                )}
                                {(task.recurring_template_id || task.recurrence_date) && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm"
                                    title={`Tugas otomatis dari jadwal rutin mingguan${task.recurrence_date ? ` (${task.recurrence_date})` : ''}`}
                                  >
                                    <Repeat className="w-2.5 h-2.5" />
                                    <span>Recurring</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => openEditModal(task)}
                                  className="p-1 hover:text-cyan-400 text-slate-400 transition"
                                  title="Edit Task"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task.id)}
                                  className="p-1 hover:text-rose-400 text-slate-400 transition"
                                  title="Hapus Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <h5 className="text-xs font-semibold text-white leading-snug">
                              {task.title}
                            </h5>

                            {task.description && (
                              <p
                                className="text-[11px] text-slate-300/90 whitespace-pre-wrap break-words leading-relaxed"
                                style={{ overflowWrap: 'anywhere' }}
                              >
                                {task.description}
                              </p>
                            )}

                            {/* TIMER & LIVE COUNTDOWN DISPLAY FOR IN_PROGRESS */}
                            {isInProgress && (
                              <div
                                className={`p-3 rounded-xl border space-y-2.5 transition-colors ${countdown.theme.bgBox} ${countdown.theme.borderBox}`}
                              >
                                {/* Countdown Header */}
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${countdown.theme.dotColor}`} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                      Hitung Mundur
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border font-mono ${countdown.theme.badgeBg} ${countdown.theme.badgeText} ${countdown.theme.badgeBorder}`}
                                  >
                                    {countdown.statusLabel}
                                  </span>
                                </div>

                                {/* Big Legible Countdown Display */}
                                <div className="flex items-baseline justify-between gap-2">
                                  <div className="flex items-baseline gap-1.5">
                                    <span
                                      className={`text-2xl font-black font-mono tracking-wider tabular-nums ${countdown.theme.textColor}`}
                                    >
                                      {countdown.formattedTime}
                                    </span>
                                    {!countdown.isOverdue && countdown.hasDeadline && (
                                      <span className="text-[10px] text-slate-400 font-mono">sisa</span>
                                    )}
                                  </div>
                                  {countdown.hasDeadline ? (
                                    <div className="text-right">
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        Deadline: <strong className="text-white">{formatDeadlineDisplay(task.started_at, task.deadline_at)}</strong>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 italic">Tanpa deadline</span>
                                  )}
                                </div>

                                {/* Metadata: Durasi estimasi & Jam mulai */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-[#1E4575] text-[10px] text-slate-400 font-mono">
                                  <span>Estimasi: <strong className="text-slate-200">{task.estimated_minutes ?? 0} mnt</strong></span>
                                  <span>Mulai: <strong className="text-slate-200">{formatTime24h(task.started_at)}</strong></span>
                                </div>
                              </div>
                            )}

                            {/* DURATION & COMPLETION INFO FOR DONE */}
                            {isDone && (
                              <div className="p-2.5 bg-[#071B35]/80 border border-emerald-500/20 rounded-xl space-y-1.5 text-[10px] font-mono text-slate-400">
                                <div className="flex items-center justify-between text-slate-300">
                                  <span>⏱ Durasi: <strong className="text-emerald-400">{task.actual_minutes ?? task.estimated_minutes ?? 0} mnt</strong></span>
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    ✓ Selesai
                                  </span>
                                </div>
                                <div className="text-slate-400 flex items-center justify-between text-[9px] pt-1 border-t border-[#1E4575] flex-wrap gap-1">
                                  <span>Mulai: <strong className="text-slate-300">{formatTime24h(task.started_at)}</strong></span>
                                  <span>Deadline: <strong className="text-slate-300">{formatDeadlineDisplay(task.started_at, task.deadline_at)}</strong></span>
                                  {task.completed_at && <span>Selesai: <strong className="text-slate-300">{formatTime24h(task.completed_at)}</strong></span>}
                                </div>
                              </div>
                            )}

                            {/* PRIMARY ACTION BUTTON FOR TODAY: "→ Kerjakan" */}
                            {isToday && (
                              <button
                                type="button"
                                disabled={startingTaskId === task.id}
                                onClick={() => handleStartTask(task)}
                                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:from-blue-700 active:to-cyan-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                                title="Mulai kerjakan tugas sekarang dan hitung deadline otomatis"
                              >
                                {startingTaskId === task.id ? (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                    <span>Memulai...</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Kerjakan</span>
                                    <span className="text-[10px] font-mono text-cyan-200">
                                      ({task.estimated_minutes ?? 30} mnt)
                                    </span>
                                  </span>
                                )}
                              </button>
                            )}

                            {/* PRIMARY ACTION BUTTON FOR IN_PROGRESS: "✓ Selesaikan" */}
                            {isInProgress && (
                              <button
                                type="button"
                                disabled={completingTaskId === task.id}
                                onClick={() => handleCompleteTask(task)}
                                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:from-emerald-700 active:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                                title="Tandai tugas selesai dan catat waktu penyelesaian aktual"
                              >
                                {completingTaskId === task.id ? (
                                  <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menyimpan...</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Selesaikan Tugas</span>
                                  </span>
                                )}
                              </button>
                            )}

                            {/* Bottom Bar: Meta info & Mover buttons */}
                            <div className="pt-2 border-t border-[#1E4575] flex items-center justify-between text-[10px] text-slate-400">
                              <div className="flex items-center gap-2 flex-wrap">
                                {!isInProgress && !isDone && (
                                  <span>⏱ {task.estimated_minutes ?? task.estimated_duration ?? 0} mnt</span>
                                )}
                                {task.outreach_count > 0 && (
                                  <span>🎯 {task.outreach_count} outreach</span>
                                )}
                              </div>

                              {/* Status mover buttons */}
                              <div className="flex items-center gap-1">
                                {isBacklog && (
                                  <button
                                    onClick={() => moveTaskStatus(task.id, 'today')}
                                    disabled={todayCount >= 3}
                                    className="px-2 py-0.5 rounded bg-[#071B35] hover:bg-[#15385F] text-slate-300 text-[10px] font-medium disabled:opacity-40 transition border border-[#1E4575]"
                                    title="Pindah ke Prioritas Hari Ini"
                                  >
                                    Today
                                  </button>
                                )}

                                {!isDone && !isInProgress && (
                                  <button
                                    onClick={() => handleCompleteTask(task)}
                                    disabled={completingTaskId === task.id}
                                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] transition disabled:opacity-40"
                                    title="Tandai Selesai Langsung"
                                  >
                                    ✓
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      </section>

      {/* 5. Create / Edit Task Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#102D50] border border-[#1E4575] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E4575]">
              <h3 className="text-base font-bold text-white">
                {editingTask ? 'Edit Task Eksekusi' : 'Tambah Task Eksekusi'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {validationAlert && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                {validationAlert}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Bisnis Terkait
                </label>
                <select
                  value={taskBusinessKey}
                  onChange={(e) => setTaskBusinessKey(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#071B35] border border-[#1E4575] rounded-xl text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="jamu_herbal">Jamu Herbal</option>
                  <option value="akademi_spiritual">Akademi Spiritual</option>
                  <option value="pakar_digital">Pakar Digital</option>
                  <option value="general">Umum (Non-Bisnis Khusus)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Judul Task
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Misal: Kontak 10 prospek webinar"
                  className="w-full px-3 py-2.5 bg-[#071B35] border border-[#1E4575] rounded-xl text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Keterangan / Deskripsi
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instruksi spesifik atau rincian kegiatan (tekan Enter untuk baris baru)"
                  className="w-full px-3 py-2.5 bg-[#071B35] border border-[#1E4575] rounded-xl text-white focus:outline-none focus:border-cyan-500 whitespace-pre-wrap font-sans leading-relaxed text-xs"
                  style={{ overflowWrap: 'anywhere' }}
                />
                {description && (
                  <div className="mt-2 p-3 rounded-xl bg-[#071B35]/70 border border-[#1E4575]/70 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold tracking-wider block">
                      Pratinjau Format Deskripsi:
                    </span>
                    <p
                      className="text-xs text-slate-200 whitespace-pre-wrap break-words leading-relaxed font-sans"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {description}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2.5 bg-[#071B35] border border-[#1E4575] rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="today">Prioritas Hari Ini</option>
                    <option value="in_progress">Sedang Berjalan</option>
                    <option value="done">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Jenis Aktivitas</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2.5 bg-[#071B35] border border-[#1E4575] rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="lead_measure">Lead Measure (Pendorong Penjualan)</option>
                    <option value="support_task">Support Task (Operasional/Dukungan)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Prioritas</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Estimasi (mnt)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Durasi Aktual</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={actualMinutes}
                    onChange={(e) => setActualMinutes(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Outreach</label>
                  <input
                    type="number"
                    min="0"
                    value={outreachCount}
                    onChange={(e) => setOutreachCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E4575]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-[#0B2545] hover:bg-[#15385F] rounded-xl text-slate-300 font-semibold border border-[#1E4575]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-white font-semibold shadow-md shadow-blue-500/20"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recurring Schedule Management Modal */}
      <RecurringScheduleModal
        isOpen={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        onSyncTasks={generateRecurringTasks}
      />
    </div>
  );
};
