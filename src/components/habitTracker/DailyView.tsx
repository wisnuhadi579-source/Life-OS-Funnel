/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Check,
  Flame,
  MessageSquare,
  Edit2,
  Archive,
  Trash2,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Sun,
  Activity,
  BookOpen,
  TrendingUp,
  Heart,
  Coffee,
  Target,
  Zap,
} from 'lucide-react';
import { HabitItem, HabitDailyCheck, HabitDailyReflection } from '../../types/habitTracker';
import {
  formatJakartaDate,
  shiftDate,
  getJakartaToday,
  isHabitEligibleOnDate,
  computeHabitStreaks,
  sortHabitsBySchedule,
  formatScheduledTime,
} from '../../utils/habitMath';

interface DailyViewProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  habits: HabitItem[];
  dailyChecks: HabitDailyCheck[];
  allCompletedChecks: HabitDailyCheck[];
  reflection: HabitDailyReflection | null;
  savingReflection: boolean;
  onToggleCheck: (
    habitId: string,
    isCompleted: boolean,
    notes: string,
    habitMetadata?: {
      title?: string;
      category?: string;
      scheduled_time?: string | null;
    }
  ) => Promise<any>;
  onSaveNotes: (
    habitId: string,
    notes: string,
    isCompleted: boolean,
    habitMetadata?: {
      title?: string;
      category?: string;
      scheduled_time?: string | null;
    }
  ) => Promise<any>;
  onSaveReflection: (updates: {
    what_went_well?: string | null;
    obstacles?: string | null;
    tomorrow_plan?: string | null;
    mood?: string | null;
  }) => Promise<any>;
  onOpenEditModal: (habit: HabitItem) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onOpenCreateModal: () => void;
}

const ICON_COMPONENTS: Record<string, React.FC<{ className?: string }>> = {
  'check-circle': CheckCircle2,
  sun: Sun,
  activity: Activity,
  'book-open': BookOpen,
  'trending-up': TrendingUp,
  heart: Heart,
  coffee: Coffee,
  target: Target,
  sparkles: Sparkles,
  zap: Zap,
};

function formatCompletionTime(isoString?: string | null): string | null {
  if (!isoString) return null;
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return null;
  }
}

export const DailyView: React.FC<DailyViewProps> = ({
  selectedDate,
  onSelectDate,
  habits,
  dailyChecks,
  allCompletedChecks,
  reflection,
  savingReflection,
  onToggleCheck,
  onSaveNotes,
  onSaveReflection,
  onOpenEditModal,
  onArchiveHabit,
  onDeleteHabit,
  onOpenCreateModal,
}) => {
  const todayStr = getJakartaToday();
  const isToday = selectedDate === todayStr;

  // Active note editors per habit
  const [activeNoteHabitId, setActiveNoteHabitId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<Record<string, string>>({});

  // Reflection form states
  const [whatWentWell, setWhatWentWell] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [mood, setMood] = useState<string>('good');
  const [reflectionNotice, setReflectionNotice] = useState<string | null>(null);

  // Sync reflection form on load
  useEffect(() => {
    if (reflection) {
      setWhatWentWell(reflection.what_went_well || '');
      setObstacles(reflection.obstacles || '');
      setTomorrowPlan(reflection.tomorrow_plan || '');
      setMood(reflection.mood || 'good');
    } else {
      setWhatWentWell('');
      setObstacles('');
      setTomorrowPlan('');
      setMood('good');
    }
  }, [reflection, selectedDate]);

  // Index checks for fast lookup
  const checksMap = useMemo(() => {
    const map = new Map<string, HabitDailyCheck>();
    dailyChecks.forEach((c) => {
      map.set(c.habit_id, c);
    });
    return map;
  }, [dailyChecks]);

  // Index all completed dates per habit for accurate streak calculation
  const completedDatesByHabit = useMemo(() => {
    const map = new Map<string, Set<string>>();
    allCompletedChecks.forEach((c) => {
      if (c.is_completed) {
        if (!map.has(c.habit_id)) map.set(c.habit_id, new Set());
        map.get(c.habit_id)!.add(c.check_date);
      }
    });
    return map;
  }, [allCompletedChecks]);

  // Filter habits that are eligible on this date & SORT BY SCHEDULE
  const eligibleHabits = useMemo(() => {
    return habits
      .filter((h) => isHabitEligibleOnDate(h, selectedDate))
      .sort(sortHabitsBySchedule);
  }, [habits, selectedDate]);

  // Calculate daily progress
  const completedCount = useMemo(() => {
    let count = 0;
    eligibleHabits.forEach((h) => {
      const check = checksMap.get(h.id);
      if (check && check.is_completed) {
        count++;
      }
    });
    return count;
  }, [eligibleHabits, checksMap]);

  const eligibleCount = eligibleHabits.length;
  const progressPercent = eligibleCount > 0 ? Math.round((completedCount / eligibleCount) * 100) : 0;

  const handlePrevDay = () => onSelectDate(shiftDate(selectedDate, -1));
  const handleNextDay = () => onSelectDate(shiftDate(selectedDate, 1));
  const handleJumpToday = () => onSelectDate(todayStr);

  const handleToggleHabit = async (habit: HabitItem) => {
    const check = checksMap.get(habit.id);
    const isCompleted = check ? check.is_completed : false;
    const notes = check?.notes || '';
    await onToggleCheck(habit.id, isCompleted, notes, {
      title: habit.title,
      category: habit.category,
      scheduled_time: habit.scheduled_time || null,
    });
  };

  const handleSaveHabitNote = async (habit: HabitItem) => {
    const noteText = tempNotes[habit.id] ?? (checksMap.get(habit.id)?.notes || '');
    const check = checksMap.get(habit.id);
    await onSaveNotes(habit.id, noteText, check ? check.is_completed : false, {
      title: habit.title,
      category: habit.category,
      scheduled_time: habit.scheduled_time || null,
    });
    setActiveNoteHabitId(null);
  };

  const handleSaveReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReflectionNotice(null);
    const res = await onSaveReflection({
      what_went_well: whatWentWell.trim() || null,
      obstacles: obstacles.trim() || null,
      tomorrow_plan: tomorrowPlan.trim() || null,
      mood,
    });

    if (res.success) {
      setReflectionNotice('Refleksi harian berhasil disimpan!');
      setTimeout(() => setReflectionNotice(null), 3000);
    } else {
      setReflectionNotice(`Gagal menyimpan: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Date Navigation Controller */}
      <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-[#071B35] hover:bg-[#102D50] text-slate-300 hover:text-white border border-[#1E3A5F] transition"
            title="Hari Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleJumpToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isToday
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-[#071B35] text-slate-300 hover:text-white border-[#1E3A5F]'
            }`}
          >
            Hari Ini
          </button>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-[#071B35] hover:bg-[#102D50] text-slate-300 hover:text-white border border-[#1E3A5F] transition"
            title="Hari Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#1E3A5F] mx-1 hidden sm:block" />

          {/* Date Picker Input */}
          <div className="flex items-center gap-2 bg-[#071B35] px-3 py-1.5 rounded-xl border border-[#1E3A5F]">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-mono"
            />
          </div>
        </div>

        {/* Selected Date Headline */}
        <div className="text-left sm:text-right">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {formatJakartaDate(selectedDate)}
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            {isToday ? '● Hari Berjalan' : selectedDate < todayStr ? 'Histori Lampau' : 'Tanggal Mendatang'}
          </span>
        </div>
      </div>

      {/* 2. Daily Progress Summary Card */}
      <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                PROGRESS HARI INI
              </span>
              {progressPercent === 100 && eligibleCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Sparkles className="w-3 h-3" />
                  <span>Sempurna!</span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {progressPercent}%
              </span>
              <span className="text-xs text-slate-400">
                ({completedCount} dari {eligibleCount} kebiasaan diselesaikan)
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-300 block">
              {progressPercent === 100 && eligibleCount > 0
                ? 'Semua disiplin harian tuntas. Pertahankan konsistensi!'
                : progressPercent > 0
                ? `${eligibleCount - completedCount} kebiasaan lagi untuk mencapai 100% hari ini.`
                : 'Mulai centang kebiasaan pertama Anda hari ini.'}
            </span>
          </div>
        </div>

        {/* Animated Modern Progress Bar */}
        <div className="w-full h-3 bg-[#071B35] rounded-full overflow-hidden border border-[#1E3A5F]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 shadow-[0_0_12px_rgba(14,165,233,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3. Habit Checklist Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <span>DAFTAR DISIPLIN HARIAN</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0B2545] text-cyan-300 border border-[#1E3A5F]">
              {eligibleHabits.length} Kebiasaan
            </span>
          </h3>

          <button
            onClick={onOpenCreateModal}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold hover:underline"
          >
            + Tambah Kebiasaan
          </button>
        </div>

        {eligibleHabits.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#1E3A5F] bg-[#071B35]/40 p-6 space-y-3">
            <Target className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white">Tidak ada kebiasaan aktif pada tanggal ini</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tambahkan kebiasaan harian baru untuk mulai membangun disiplin konsistensi Anda.
              </p>
            </div>
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20"
            >
              + Tambah Kebiasaan Baru
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {eligibleHabits.map((habit) => {
              const check = checksMap.get(habit.id);
              const isCompleted = check ? check.is_completed : false;
              const completedDates = completedDatesByHabit.get(habit.id) || new Set();
              const { currentStreak } = computeHabitStreaks(habit, completedDates, todayStr);
              const isEditingNote = activeNoteHabitId === habit.id;
              const IconComp = ICON_COMPONENTS[habit.icon || 'check-circle'] || CheckCircle2;
              const formattedTime = formatScheduledTime(habit.scheduled_time);
              const completionTime = isCompleted ? formatCompletionTime(check?.completed_at) : null;

              return (
                <div
                  key={habit.id}
                  className={`rounded-2xl border p-4 transition-all space-y-3 group ${
                    isCompleted
                      ? 'bg-[#0B2545]/95 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                      : 'bg-[#0B2545]/60 hover:bg-[#0B2545] border-[#15385F] hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Checkbox & Main Info */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Checkbox with Green/Neutral indicator */}
                      <button
                        type="button"
                        onClick={() => handleToggleHabit(habit)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                            : 'bg-[#071B35] border-[#1E3A5F] hover:border-cyan-400 text-transparent'
                        }`}
                        title={isCompleted ? 'Batalkan checklist' : 'Tandai selesai'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Badges Row: Time, Category, Status, Streak */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Schedule Time Badge */}
                          {formattedTime ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span>{formattedTime}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-md bg-[#071B35] border border-[#1E3A5F]">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Tanpa Jadwal</span>
                            </span>
                          )}

                          {/* Category Badge */}
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border font-mono"
                            style={{
                              backgroundColor: `${habit.color}15`,
                              borderColor: `${habit.color}50`,
                              color: habit.color,
                            }}
                          >
                            <IconComp className="w-3 h-3" />
                            <span>{habit.category}</span>
                          </span>

                          {/* Status Badge: Selesai / Belum Selesai */}
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Selesai{completionTime ? ` pk ${completionTime}` : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700 font-mono">
                              Belum Selesai
                            </span>
                          )}

                          {/* Streak Badge */}
                          {currentStreak > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                              <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>{currentStreak} hari</span>
                            </span>
                          )}
                        </div>

                        {/* Habit Title */}
                        <div>
                          <h4
                            className={`text-sm font-bold tracking-tight transition-all ${
                              isCompleted
                                ? 'line-through text-slate-400'
                                : 'text-white group-hover:text-cyan-200'
                            }`}
                          >
                            {habit.title}
                          </h4>
                          {habit.description && (
                            <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                              {habit.description}
                            </p>
                          )}
                        </div>

                        {/* Existing Notes Preview */}
                        {check?.notes && !isEditingNote && (
                          <div className="pt-0.5 flex items-start gap-1.5 text-xs text-cyan-300/90 font-mono">
                            <MessageSquare className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="italic">"{check.notes}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons: Note, Edit, Archive, Delete */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingNote) {
                            setActiveNoteHabitId(null);
                          } else {
                            setActiveNoteHabitId(habit.id);
                            setTempNotes({ ...tempNotes, [habit.id]: check?.notes || '' });
                          }
                        }}
                        className={`p-1.5 rounded-lg border transition ${
                          check?.notes || isEditingNote
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-[#071B35] text-slate-400 hover:text-white border-[#1E3A5F]'
                        }`}
                        title="Catatan Tambahan"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenEditModal(habit)}
                        className="p-1.5 rounded-lg bg-[#071B35] hover:bg-[#102D50] text-slate-400 hover:text-cyan-300 border border-[#1E3A5F] transition"
                        title="Edit Kebiasaan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onArchiveHabit(habit.id)}
                        className="p-1.5 rounded-lg bg-[#071B35] hover:bg-[#102D50] text-slate-400 hover:text-amber-300 border border-[#1E3A5F] transition"
                        title="Arsipkan Kebiasaan"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteHabit(habit.id)}
                        className="p-1.5 rounded-lg bg-[#071B35] hover:bg-[#102D50] text-slate-400 hover:text-rose-400 border border-[#1E3A5F] transition"
                        title="Hapus Permanen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Note Editor */}
                  {isEditingNote && (
                    <div className="pt-2 border-t border-[#1E3A5F] flex items-center gap-2">
                      <input
                        type="text"
                        value={tempNotes[habit.id] ?? ''}
                        onChange={(e) =>
                          setTempNotes({ ...tempNotes, [habit.id]: e.target.value })
                        }
                        placeholder="Tulis catatan pelaksanaan habit hari ini (misal: 10 km, bab 3 selesai)..."
                        className="flex-1 px-3 py-1.5 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveHabitNote(habit)}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold"
                      >
                        Simpan
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Daily Reflection Panel */}
      <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-3">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-4 h-4" />
            <span>REFLEKSI HARIAN (DAILY REFLECTION)</span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Evaluasi harian untuk perbaikan konsisten
          </span>
        </div>

        {reflectionNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reflectionNotice}</span>
          </div>
        )}

        <form onSubmit={handleSaveReflectionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* What went well */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-300 block">
                1. Apa yang berhasil hari ini?
              </label>
              <textarea
                rows={3}
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                placeholder="Keberhasilan disiplin, fokus tinggi, pencapaian target..."
                className="w-full px-3 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Obstacles */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-rose-300 block">
                2. Apa hambatan terbesar?
              </label>
              <textarea
                rows={3}
                value={obstacles}
                onChange={(e) => setObstacles(e.target.value)}
                placeholder="Rasa malas, distraksi, waktu terbuang, kelelahan..."
                className="w-full px-3 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-sans leading-relaxed resize-none"
              />
            </div>

            {/* Tomorrow plan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-cyan-300 block">
                3. Apa yang ingin diperbaiki besok?
              </label>
              <textarea
                rows={3}
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="Strategi pencegahan, jam bangun, persiapan malam ini..."
                className="w-full px-3 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-sans leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Mood Selector & Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1E3A5F]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Mood Hari Ini:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'great', label: 'Luar Biasa', emoji: '🔥' },
                  { id: 'good', label: 'Baik', emoji: '😊' },
                  { id: 'neutral', label: 'Biasa Saja', emoji: '😐' },
                  { id: 'low', label: 'Kurang Baik', emoji: '😔' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMood(item.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      mood === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold shadow-sm'
                        : 'bg-[#071B35] text-slate-400 hover:text-white border-[#1E3A5F]'
                    }`}
                  >
                    <span>{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingReflection}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingReflection ? 'Menyimpan...' : 'Simpan Refleksi Harian'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
