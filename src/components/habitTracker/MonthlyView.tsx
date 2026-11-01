/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  Calendar,
  Trophy,
  Flame,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { HabitItem, HabitDailyCheck } from '../../types/habitTracker';
import {
  INDONESIAN_MONTH_NAMES,
  calculateMonthlyHabitSummary,
  getJakartaToday,
  formatMonthlyProgress,
} from '../../utils/habitMath';

interface MonthlyViewProps {
  selectedYear: number;
  selectedMonth: number; // 1 - 12
  onSelectMonthYear: (year: number, month: number) => void;
  onJumpToDate: (dateStr: string) => void;
  habits: HabitItem[];
  monthChecks: HabitDailyCheck[];
}

const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  selectedYear,
  selectedMonth,
  onSelectMonthYear,
  onJumpToDate,
  habits,
  monthChecks,
}) => {
  const todayStr = getJakartaToday();

  // Compute full monthly summary
  const summary = useMemo(() => {
    return calculateMonthlyHabitSummary(
      habits,
      monthChecks,
      selectedYear,
      selectedMonth,
      todayStr
    );
  }, [habits, monthChecks, selectedYear, selectedMonth, todayStr]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onSelectMonthYear(selectedYear - 1, 12);
    } else {
      onSelectMonthYear(selectedYear, selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onSelectMonthYear(selectedYear + 1, 1);
    } else {
      onSelectMonthYear(selectedYear, selectedMonth + 1);
    }
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return summary.calendarDays
      .filter((d) => d.isPastOrToday)
      .map((d) => ({
        day: `Tgl ${d.dayNumber}`,
        rate: d.completionRate,
        completed: d.totalCompleted,
        total: d.totalEligible,
      }));
  }, [summary.calendarDays]);

  // Compute offset for calendar first day (1 = Monday, 7 = Sunday)
  const firstDayOfMonthDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
  // getUTCDay: 0=Sunday, 1=Monday... 6=Saturday
  const firstDayOfWeek = firstDayOfMonthDate.getUTCDay();
  const leadingBlanks = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // 0 for Monday, 6 for Sunday

  return (
    <div className="space-y-6">
      {/* 1. Month / Year Navigation Controller */}
      <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-[#071B35] hover:bg-[#102D50] text-slate-300 hover:text-white border border-[#1E3A5F] transition"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-[#071B35] px-3.5 py-1.5 rounded-xl border border-[#1E3A5F]">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonthYear(selectedYear, Number(e.target.value))}
              className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
            >
              {INDONESIAN_MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx + 1} className="bg-[#061A32]">
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => onSelectMonthYear(Number(e.target.value), selectedMonth)}
              className="bg-transparent text-xs text-white font-mono font-semibold focus:outline-none cursor-pointer border-l border-[#1E3A5F] pl-2"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-[#061A32]">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-[#071B35] hover:bg-[#102D50] text-slate-300 hover:text-white border border-[#1E3A5F] transition"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">
            REKAP KONSISTENSI BULANAN
          </span>
          <span className="text-base font-extrabold text-white tracking-tight">
            {summary.monthLabel}
          </span>
        </div>
      </div>

      {/* 2. Monthly Progress Overview & Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Overall Progress */}
        <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Konsistensi Bulanan
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {formatMonthlyProgress(summary.overallMonthlyProgress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#071B35] rounded-full overflow-hidden border border-[#1E3A5F]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
              style={{ width: `${Math.min(100, Math.max(0, summary.overallMonthlyProgress))}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 font-mono block">
            {summary.totalCompletedChecks} dari {summary.totalEligibleOccurrences} kesempatan checklist
          </span>
        </div>

        {/* Metric 2: Hari Sempurna (100%) */}
        <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Hari Sempurna
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {summary.perfectDaysCount}
            </span>
            <span className="text-xs text-slate-400">Hari (100%)</span>
          </div>
          <span className="text-[11px] text-slate-400 block pt-1">
            Hari di mana seluruh kebiasaan harian berhasil dituntaskan.
          </span>
        </div>

        {/* Metric 3: Best Consistency Habit */}
        <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Kebiasaan Terbaik
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-white truncate" title={summary.bestConsistencyHabit?.title || '-'}>
            {summary.bestConsistencyHabit?.title || 'Belum ada data'}
          </p>
          <span className="text-[11px] text-purple-300 font-mono block">
            {summary.habitsPerformance[0]?.completionRate || 0}% kepatuhan
          </span>
        </div>

        {/* Metric 4: Streak Tertinggi */}
        <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 shadow-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Streak Tertinggi
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Flame className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
              {summary.highestStreak}
            </span>
            <span className="text-xs text-slate-400">Hari Berturut-turut</span>
          </div>
          <span className="text-[11px] text-slate-400 block pt-1">
            Rekor disiplin berturut-turut terpanjang.
          </span>
        </div>
      </div>

      {/* 3. Monthly Calendar Heatmap */}
      <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>KALENDER KONSISTENSI (MONTHLY HEATMAP)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik tanggal mana pun untuk membuka rincian checklist hari tersebut.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 shadow-sm" />
              <span>100% Selesai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500 shadow-sm" />
              <span>Sebagian</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#071B35] border border-[#1E3A5F]" />
              <span>0% Selesai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#071B35]/40 border border-dashed border-[#1E3A5F]" />
              <span>Mendatang</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-1.5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono font-bold text-slate-400 pb-1">
            {DAY_HEADERS.map((h) => (
              <div key={h} className="py-1">
                {h}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading cells */}
            {Array.from({ length: leadingBlanks }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-20 rounded-xl bg-transparent" />
            ))}

            {/* Days in Month */}
            {summary.calendarDays.map((day) => {
              let bgClass = 'bg-[#071B35] border-[#1E3A5F] text-slate-400 hover:border-cyan-500';
              let badgeText = `${day.totalCompleted}/${day.totalEligible}`;

              if (day.status === 'future') {
                bgClass = 'bg-[#071B35]/30 border-[#1E3A5F]/40 border-dashed text-slate-500 cursor-not-allowed';
                badgeText = '-';
              } else if (day.status === 'perfect') {
                bgClass = 'bg-emerald-950/40 border-emerald-500/60 text-white hover:border-emerald-400 ring-1 ring-emerald-500/20';
              } else if (day.status === 'partial') {
                bgClass = 'bg-cyan-950/40 border-cyan-500/50 text-white hover:border-cyan-400 ring-1 ring-cyan-500/20';
              }

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => onJumpToDate(day.date)}
                  className={`h-20 p-2 rounded-xl border transition-all text-left flex flex-col justify-between group relative ${bgClass} ${
                    day.isToday ? 'ring-2 ring-cyan-400' : ''
                  }`}
                  title={`${day.date}: ${day.totalCompleted} dari ${day.totalEligible} (${day.completionRate}%)`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold font-mono ${
                        day.isToday
                          ? 'w-5 h-5 rounded-full bg-cyan-400 text-slate-900 flex items-center justify-center font-black'
                          : ''
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {day.status === 'perfect' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    {day.status !== 'future' && (
                      <>
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">{badgeText}</span>
                          <span
                            className={`font-bold ${
                              day.status === 'perfect'
                                ? 'text-emerald-400'
                                : day.status === 'partial'
                                ? 'text-cyan-300'
                                : 'text-slate-500'
                            }`}
                          >
                            {day.completionRate}%
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full h-1 bg-[#061A32] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              day.status === 'perfect'
                                ? 'bg-emerald-400'
                                : day.status === 'partial'
                                ? 'bg-cyan-400'
                                : 'bg-transparent'
                            }`}
                            style={{ width: `${day.completionRate}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Habit Performance Breakdown */}
      <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
              <Trophy className="w-4 h-4 text-cyan-400" />
              <span>PERFORMA SETIAP KEBIASAAN (HABIT PERFORMANCE)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rasio hari berhasil terhadap hari berlaku beserta rentang streak terpanjang.
            </p>
          </div>
        </div>

        {summary.habitsPerformance.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 italic">
            Belum ada kebiasaan yang terdaftar untuk bulan ini.
          </div>
        ) : (
          <div className="space-y-3">
            {summary.habitsPerformance.map((item) => (
              <div
                key={item.habit.id}
                className="p-4 rounded-xl bg-[#071B35]/80 border border-[#1E3A5F] space-y-2.5 transition hover:border-cyan-500/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: item.habit.color }}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{item.habit.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        Kategori: {item.habit.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Konsistensi</span>
                      <span className="font-extrabold text-white text-sm">
                        {item.completedDays}/{item.eligibleDays} hari ({item.completionRate}%)
                      </span>
                    </div>

                    <div className="text-right border-l border-[#1E3A5F] pl-3">
                      <span className="text-slate-400 text-[10px] block">Streak Saat Ini</span>
                      <span className="font-bold text-amber-400 flex items-center justify-end gap-1">
                        <Flame className="w-3 h-3 fill-amber-400" />
                        <span>{item.currentStreak} hr (Max: {item.longestStreak})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Progress Bar */}
                <div className="w-full h-2.5 bg-[#061A32] rounded-full overflow-hidden border border-[#1E3A5F]/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.completionRate}%`,
                      backgroundColor: item.habit.color || '#0EA5E9',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Daily Progress Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#0B2545]/90 border border-[#15385F] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>TREN PERSENTASE KONSISTENSI HARIAN</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Grafik fluktuasi persentase penyelesaian disiplin harian sepanjang bulan.
              </p>
            </div>
          </div>

          <div className="w-full h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#15385F" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#061A32] border border-cyan-500/40 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.day}</p>
                          <p className="text-cyan-300 font-mono font-bold">
                            Penyelesaian: {data.rate}%
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {data.completed} dari {data.total} kebiasaan
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="#0EA5E9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rateGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
