/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Plus,
  Flame,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Archive,
  Trash2,
} from 'lucide-react';
import { useHabits } from '../hooks/useHabits';
import { useHabitChecks } from '../hooks/useHabitChecks';
import { useHabitReflection } from '../hooks/useHabitReflection';
import { HabitItem, HabitTrackerMode } from '../types/habitTracker';
import { getJakartaToday, computeHabitStreaks, calculateMonthlyHabitSummary, formatMonthlyProgress } from '../utils/habitMath';
import { DailyView } from '../components/habitTracker/DailyView';
import { MonthlyView } from '../components/habitTracker/MonthlyView';
import { HabitModal } from '../components/habitTracker/HabitModal';
import { AchievementCardGenerator } from '../components/habitTracker/AchievementCardGenerator';

export const HabitTrackerPage: React.FC = () => {
  const todayStr = getJakartaToday();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month & Year state for monthly view
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return Number(todayStr.split('-')[0]);
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return Number(todayStr.split('-')[1]);
  });

  // Mode: 'daily' | 'monthly' (default: 'daily')
  const [mode, setMode] = useState<HabitTrackerMode>('daily');

  // Modals state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);

  // Delete / Archive confirmation modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  // Hooks
  const {
    habits,
    loading: loadingHabits,
    createHabit,
    updateHabit,
    archiveHabit,
    deleteHabit,
  } = useHabits();

  const {
    dailyChecks,
    monthChecks,
    fetchDailyChecks,
    fetchMonthChecks,
    fetchAllChecks,
    toggleHabitCheck,
    saveCheckNotes,
  } = useHabitChecks();

  const {
    reflection,
    saving: savingReflection,
    fetchReflection,
    saveReflection,
  } = useHabitReflection();

  // All completed checks for computing accurate streaks
  const [allCompletedChecks, setAllCompletedChecks] = useState<any[]>([]);

  // Load daily data when selectedDate changes
  useEffect(() => {
    fetchDailyChecks(selectedDate);
    fetchReflection(selectedDate);
  }, [selectedDate, fetchDailyChecks, fetchReflection]);

  // Load monthly checks when month/year changes or when switching to monthly
  useEffect(() => {
    fetchMonthChecks(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchMonthChecks]);

  // Load all checks once for streak calculation
  useEffect(() => {
    fetchAllChecks().then((data) => setAllCompletedChecks(data));
  }, [fetchAllChecks, dailyChecks]);

  // Handle month selection
  const handleSelectMonthYear = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  // Jump from calendar cell to daily view
  const handleJumpToDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setMode('daily');
  };

  const handleOpenCreateModal = () => {
    setEditingHabit(null);
    setIsHabitModalOpen(true);
  };

  const handleOpenEditModal = (habit: HabitItem) => {
    setEditingHabit(habit);
    setIsHabitModalOpen(true);
  };

  const handleSaveHabit = async (data: Partial<HabitItem>) => {
    if (editingHabit) {
      return updateHabit(editingHabit.id, data);
    } else {
      return createHabit(data as any);
    }
  };

  // Compute Header Overview Stats
  const activeHabitsCount = useMemo(() => {
    return habits.filter((h) => h.is_active).length;
  }, [habits]);

  // Today progress
  const todayProgressPercent = useMemo(() => {
    const eligibleToday = habits.filter((h) => h.start_date <= todayStr && (!h.end_date || todayStr <= h.end_date));
    if (eligibleToday.length === 0) return 0;
    const checksToday = dailyChecks.filter((c) => c.check_date === todayStr && c.is_completed);
    return Math.round((checksToday.length / eligibleToday.length) * 100);
  }, [habits, dailyChecks, todayStr]);

  // Monthly overall progress
  const monthlySummary = useMemo(() => {
    return calculateMonthlyHabitSummary(habits, monthChecks, selectedYear, selectedMonth, todayStr);
  }, [habits, monthChecks, selectedYear, selectedMonth, todayStr]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header & Overview Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E3A5F] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider font-mono">
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Discipline & Consistency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5 mt-0.5">
            <span>HABIT TRACKER</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Disiplin Harian
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bangun momentum dan konsistensi kebiasaan penting setiap hari dengan histori permanen dan pelacakan streak.
          </p>
        </div>

        {/* Right Action: Add Habit Button & Mode Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Control Mode Switch */}
          <div className="bg-[#0B2545] p-1 rounded-xl border border-[#1E3A5F] flex items-center text-xs font-semibold">
            <button
              onClick={() => setMode('daily')}
              className={`px-4 py-2 rounded-lg transition-all ${
                mode === 'daily'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HARIAN
            </button>
            <button
              onClick={() => setMode('monthly')}
              className={`px-4 py-2 rounded-lg transition-all ${
                mode === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              BULANAN
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kebiasaan</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Progress Hari Ini */}
        <div className="bg-[#0B2545]/80 border border-[#15385F] rounded-2xl p-4 space-y-1 relative shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Progress Hari Ini
            </span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{todayProgressPercent}%</p>
          <span className="text-[10px] text-slate-400 font-mono block">Status harian</span>
        </div>

        {/* Metric 2: Progress Bulan Ini */}
        <div className="bg-[#0B2545]/80 border border-[#15385F] rounded-2xl p-4 space-y-1 relative shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Progress Bulan Ini
            </span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">
            {formatMonthlyProgress(monthlySummary.overallMonthlyProgress)}%
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">
            {monthlySummary.monthLabel}
          </span>
        </div>

        {/* Metric 3: Total Kebiasaan Aktif */}
        <div className="bg-[#0B2545]/80 border border-[#15385F] rounded-2xl p-4 space-y-1 relative shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Kebiasaan Aktif
            </span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{activeHabitsCount}</p>
          <span className="text-[10px] text-slate-400 font-mono block">Disiplin berjalan</span>
        </div>

        {/* Metric 4: Streak Saat Ini */}
        <div className="bg-[#0B2545]/80 border border-[#15385F] rounded-2xl p-4 space-y-1 relative shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Streak Tertinggi
            </span>
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">
            {monthlySummary.highestStreak} <span className="text-sm font-sans font-bold">Hari</span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">Konsistensi rekor</span>
        </div>
      </div>

      {/* 3. Main Views (Daily vs Monthly) */}
      {mode === 'daily' ? (
        <DailyView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          habits={habits}
          dailyChecks={dailyChecks}
          allCompletedChecks={allCompletedChecks}
          reflection={reflection}
          savingReflection={savingReflection}
          onToggleCheck={(habitId, isCompleted, notes, habitMetadata) =>
            toggleHabitCheck(habitId, selectedDate, isCompleted, notes, habitMetadata)
          }
          onSaveNotes={(habitId, notes, isCompleted, habitMetadata) =>
            saveCheckNotes(habitId, selectedDate, notes, isCompleted, habitMetadata)
          }
          onSaveReflection={(data) => saveReflection(selectedDate, data)}
          onOpenEditModal={handleOpenEditModal}
          onArchiveHabit={(id) => setConfirmArchiveId(id)}
          onDeleteHabit={(id) => setConfirmDeleteId(id)}
          onOpenCreateModal={handleOpenCreateModal}
        />
      ) : (
        <MonthlyView
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onSelectMonthYear={handleSelectMonthYear}
          onJumpToDate={handleJumpToDate}
          habits={habits}
          monthChecks={monthChecks}
        />
      )}

      {/* 4. Achievement Card Generator (Placed directly below Daily Reflection / Main Content) */}
      <AchievementCardGenerator
        selectedDate={selectedDate}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        habits={habits}
        dailyChecks={dailyChecks}
        monthChecks={monthChecks}
        monthlySummary={monthlySummary}
      />

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        editingHabit={editingHabit}
        onSave={handleSaveHabit}
      />

      {/* Archive Confirmation Modal */}
      {confirmArchiveId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#102D50] border border-amber-500/40 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-amber-400">
              <Archive className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Arsipkan Kebiasaan?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kebiasaan akan dinonaktifkan mulai hari ini. Seluruh histori checklist masa lalu tetap aman dan tersimpan di laporan bulanan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setConfirmArchiveId(null)}
                className="px-4 py-2 bg-[#0B2545] hover:bg-[#15385F] border border-[#1E3A5F] rounded-xl text-xs font-semibold text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await archiveHabit(confirmArchiveId);
                  setConfirmArchiveId(null);
                }}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Ya, Arsipkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#102D50] border border-rose-500/40 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Hapus Permanen Kebiasaan?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kebiasaan ini beserta seluruh histori checklist-nya akan dihapus permanen. Gunakan fitur Arsip jika ingin mempertahankan histori bulanan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-[#0B2545] hover:bg-[#15385F] border border-[#1E3A5F] rounded-xl text-xs font-semibold text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteHabit(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
