/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Flame,
  CheckCircle2,
  Award,
  Target,
  Loader2,
  Check,
  Sparkles,
  HeartPulse,
  Briefcase,
  User,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLifeProfile } from '../../hooks/useLifeProfile';
import {
  HabitItem,
  HabitDailyCheck,
  MonthlyHabitSummary,
  AchievementCardType,
} from '../../types/habitTracker';
import {
  formatJakartaDate,
  calculateDailyActivities,
  calculateCategoryGrowthDetails,
  INDONESIAN_MONTH_NAMES,
  formatMonthlyProgress,
} from '../../utils/habitMath';

interface AchievementCardGeneratorProps {
  selectedDate: string;
  selectedYear: number;
  selectedMonth: number;
  habits: HabitItem[];
  dailyChecks: HabitDailyCheck[];
  monthChecks: HabitDailyCheck[];
  monthlySummary: MonthlyHabitSummary;
}

interface CategoryVisualConfig {
  name: string;
  color: string;
  accentColor: string;
  glow: string;
  border: string;
  bgGradient: string;
  badgeBg: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
}

const CATEGORY_VISUALS: Record<string, CategoryVisualConfig> = {
  kesehatan: {
    name: 'KESEHATAN',
    color: '#10B981', // Emerald Green
    accentColor: '#34D399',
    glow: 'rgba(16, 185, 129, 0.45)',
    border: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.3) 100%)',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
    icon: HeartPulse,
  },
  health: {
    name: 'KESEHATAN',
    color: '#10B981',
    accentColor: '#34D399',
    glow: 'rgba(16, 185, 129, 0.45)',
    border: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(6, 78, 59, 0.3) 100%)',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
    icon: HeartPulse,
  },
  bisnis: {
    name: 'BISNIS',
    color: '#A855F7', // Violet
    accentColor: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.45)',
    border: 'rgba(168, 85, 247, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, rgba(88, 28, 135, 0.3) 100%)',
    badgeBg: 'rgba(168, 85, 247, 0.22)',
    icon: Briefcase,
  },
  business: {
    name: 'BISNIS',
    color: '#A855F7',
    accentColor: '#C084FC',
    glow: 'rgba(168, 85, 247, 0.45)',
    border: 'rgba(168, 85, 247, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, rgba(88, 28, 135, 0.3) 100%)',
    badgeBg: 'rgba(168, 85, 247, 0.22)',
    icon: Briefcase,
  },
  spiritual: {
    name: 'SPIRITUAL',
    color: '#F59E0B', // Amber / Gold
    accentColor: '#FBBF24',
    glow: 'rgba(245, 158, 11, 0.45)',
    border: 'rgba(245, 158, 11, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(120, 53, 15, 0.3) 100%)',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
    icon: Sparkles,
  },
  personal: {
    name: 'PERSONAL',
    color: '#38BDF8', // Cyan / Blue
    accentColor: '#00F2FE',
    glow: 'rgba(56, 189, 248, 0.45)',
    border: 'rgba(56, 189, 248, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16) 0%, rgba(12, 74, 110, 0.3) 100%)',
    badgeBg: 'rgba(56, 189, 248, 0.22)',
    icon: User,
  },
  learning: {
    name: 'LEARNING',
    color: '#3B82F6', // Electric Blue
    accentColor: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.45)',
    border: 'rgba(59, 130, 246, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(30, 58, 138, 0.3) 100%)',
    badgeBg: 'rgba(59, 130, 246, 0.22)',
    icon: Sparkles,
  },
  pembelajaran: {
    name: 'LEARNING',
    color: '#3B82F6',
    accentColor: '#60A5FA',
    glow: 'rgba(59, 130, 246, 0.45)',
    border: 'rgba(59, 130, 246, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.16) 0%, rgba(30, 58, 138, 0.3) 100%)',
    badgeBg: 'rgba(59, 130, 246, 0.22)',
    icon: Sparkles,
  },
  produktivitas: {
    name: 'PRODUKTIVITAS',
    color: '#06B6D4',
    accentColor: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.45)',
    border: 'rgba(6, 182, 212, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(21, 94, 117, 0.3) 100%)',
    badgeBg: 'rgba(6, 182, 212, 0.22)',
    icon: Target,
  },
  productivity: {
    name: 'PRODUKTIVITAS',
    color: '#06B6D4',
    accentColor: '#22D3EE',
    glow: 'rgba(6, 182, 212, 0.45)',
    border: 'rgba(6, 182, 212, 0.4)',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(21, 94, 117, 0.3) 100%)',
    badgeBg: 'rgba(6, 182, 212, 0.22)',
    icon: Target,
  },
};

function getCategoryVisual(categoryName: string): CategoryVisualConfig {
  const key = categoryName.trim().toLowerCase();
  if (CATEGORY_VISUALS[key]) return CATEGORY_VISUALS[key];
  return {
    name: categoryName.trim().toUpperCase(),
    color: '#38BDF8',
    accentColor: '#67E8F9',
    glow: 'rgba(56, 189, 248, 0.4)',
    border: 'rgba(56, 189, 248, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.14) 0%, rgba(15, 23, 42, 0.35) 100%)',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    icon: CheckCircle2,
  };
}

export const AchievementCardGenerator: React.FC<AchievementCardGeneratorProps> = ({
  selectedDate,
  selectedYear,
  selectedMonth,
  habits,
  dailyChecks,
  monthChecks,
  monthlySummary,
}) => {
  const { user } = useAuth();
  const { profile } = useLifeProfile();

  const [cardType, setCardType] = useState<AchievementCardType>('daily');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // 1. Identitas Pengguna Dinamis
  const userName = useMemo(() => {
    if (profile?.display_name?.trim()) return profile.display_name.trim();
    if (user?.user_metadata?.display_name) return String(user.user_metadata.display_name).trim();
    if (user?.user_metadata?.full_name) return String(user.user_metadata.full_name).trim();
    if (user?.user_metadata?.name) return String(user.user_metadata.name).trim();
    if (user?.email) return user.email.split('@')[0];
    return 'Pengguna Life OS';
  }, [profile, user]);

  // 2. Data Aktivitas Harian Aktual
  const dailyActivities = useMemo(() => {
    return calculateDailyActivities(habits, dailyChecks, selectedDate);
  }, [habits, dailyChecks, selectedDate]);

  // Kelompokkan per kategori
  const activitiesByCategory = useMemo(() => {
    const map = new Map<string, typeof dailyActivities>();
    dailyActivities.forEach((act) => {
      const cat = act.category || 'Lainnya';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(act);
    });
    return map;
  }, [dailyActivities]);

  const totalDailyActivities = dailyActivities.length;
  const completedDailyActivities = useMemo(() => {
    return dailyActivities.filter((a) => a.isCompleted).length;
  }, [dailyActivities]);

  const dailyProgressPercent = useMemo(() => {
    return totalDailyActivities > 0
      ? Math.round((completedDailyActivities / totalDailyActivities) * 100)
      : 0;
  }, [totalDailyActivities, completedDailyActivities]);

  // 3. Kontribusi Pertumbuhan Harian Aktual
  const categoryGrowthDetails = useMemo(() => {
    return calculateCategoryGrowthDetails(habits, monthChecks, selectedDate);
  }, [habits, monthChecks, selectedDate]);

  // Tanggal format Bahasa Indonesia
  const formattedDateIndo = useMemo(() => {
    return formatJakartaDate(selectedDate, true);
  }, [selectedDate]);

  // Motivasi singkat
  const headlineMotivation = useMemo(() => {
    if (dailyProgressPercent === 100) return 'Semua target hari ini tercapai!';
    if (dailyProgressPercent >= 75) return 'Hampir sempurna, selesaikan sisa target!';
    if (dailyProgressPercent >= 40) return 'Momentum terbentuk, teruskan langkah!';
    return 'Mulai fokus dan raih kemenangan pertama!';
  }, [dailyProgressPercent]);

  // Pesan motivasi elegan
  const bottomMotivationQuote = useMemo(() => {
    if (dailyProgressPercent === 100) {
      return '"Kemenangan besar dimulai dari disiplin kecil yang dituntaskan."';
    } else if (dailyProgressPercent >= 75) {
      return '"Momentum luar biasa. Konsistensi hari ini adalah fondasi masa depan."';
    } else if (dailyProgressPercent >= 40) {
      return '"Setiap langkah bernilai. Terus jaga ritme dan selesaikan yang tersisa."';
    } else {
      return '"Awal baru selalu menanti. Bangkitkan kembali fokus untuk esok hari."';
    }
  }, [dailyProgressPercent]);

  const monthlyMotivationQuote = useMemo(() => {
    const rate = monthlySummary.overallMonthlyProgress;
    if (rate >= 80) {
      return '"Konsistensi tingkat tinggi. Disiplin bulanan Anda telah membentuk standar keunggulan baru."';
    } else if (rate >= 60) {
      return '"Momentum yang kokoh. Terus pertahankan ritme menuju pencapaian North Star Anda."';
    } else {
      return '"Setiap hari adalah peluang bertumbuh. Evaluasi, perbaiki ritme, dan bangkitkan konsistensi."';
    }
  }, [monthlySummary.overallMonthlyProgress]);

  // Download Handler (skipFonts: true mencegah CORS Google Fonts)
  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      setDownloadError(null);
      setDownloadSuccess(false);

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        skipFonts: true,
        width: 1080,
        height: 1350,
        pixelRatio: 1,
        backgroundColor: '#071426',
      });

      const fileName =
        cardType === 'daily'
          ? `LifeOS-Pencapaian-Harian-${selectedDate}.png`
          : `LifeOS-Rekap-Bulanan-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: unknown) {
      console.error('Error generating card image:', err);
      const msg = err instanceof Error ? err.message : 'Gagal menghasilkan gambar kartu.';
      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[#071426]/95 border border-[#173252] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header Controller Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#173252] pb-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider font-mono">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>PREMIUM FITNESS ACHIEVEMENT CARD</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Kartu Pencapaian Eksklusif (PNG 1080 × 1350)
          </h3>
          <p className="text-xs text-slate-400">
            Desain modern fitness widget dengan hierarki nama kategori dan persentase yang menonjol serta identitas pengguna.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Mode Control */}
          <div className="bg-[#05101E] p-1 rounded-xl border border-[#173252] flex items-center text-xs font-semibold">
            <button
              onClick={() => setCardType('daily')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                cardType === 'daily'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setCardType('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                cardType === 'monthly'
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulanan
            </button>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)] transition transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD PNG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {downloadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Gambar kartu glossy berhasil diunduh ke perangkat Anda!</span>
        </div>
      )}

      {downloadError && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <span>{downloadError}</span>
        </div>
      )}

      {/* Scaled Live Preview Stage */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            Pratinjau Kartu ({cardType === 'daily' ? 'Harian' : 'Bulanan'} — Rasio 4:5 1080 × 1350)
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Resolusi ekspor tajam 1080 × 1350 px
          </span>
        </div>

        <div className="w-full overflow-x-auto py-5 bg-[#040C17] border border-[#173252] rounded-2xl flex justify-center items-center shadow-inner">
          <div
            className="origin-top transition-transform"
            style={{
              width: 1080,
              height: 1350,
              transform: 'scale(0.36)',
              marginBottom: -1350 * (1 - 0.36),
            }}
          >
            {/* CANVAS 1080 x 1350 EXACT PIXELS (Captured by html-to-image) */}
            <div
              ref={cardRef}
              style={{
                width: 1080,
                height: 1350,
                backgroundColor: '#071426',
                background:
                  'radial-gradient(circle at 50% -12%, rgba(0, 242, 254, 0.16) 0%, rgba(7, 20, 38, 1) 55%)',
                color: '#FFFFFF',
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              }}
              className="p-14 flex flex-col justify-between box-border border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative select-none"
            >
              {/* 1. HEADER: BRAND + DATE + HEADLINE + USER IDENTITY */}
              <div className="space-y-4">
                {/* Top Brand Bar */}
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
                  <div className="flex items-center gap-3.5">
                    {/* Elevated 3D Glossy Target Badge */}
                    <div
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(0, 242, 254, 0.25) 0%, rgba(16, 185, 129, 0.2) 100%)',
                        border: '1.5px solid rgba(0, 242, 254, 0.5)',
                        boxShadow:
                          '0 0 20px rgba(0, 242, 254, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    >
                      <Target className="w-6 h-6 text-cyan-300 stroke-[2.5]" />
                    </div>

                    <div>
                      <span className="text-base font-black tracking-widest uppercase font-mono block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300">
                        LIFE OS FUNNEL
                      </span>
                      <span className="text-xs font-bold tracking-wider uppercase font-mono text-slate-400">
                        HABIT TRACKER
                      </span>
                    </div>
                  </div>

                  {/* Date Badge */}
                  <div
                    style={{
                      background: 'rgba(15, 33, 60, 0.85)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold text-cyan-300 tracking-wide"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {cardType === 'daily'
                        ? formattedDateIndo
                        : `${INDONESIAN_MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}
                    </span>
                  </div>
                </div>

                {/* Main Headline & Dynamic User Profile */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-2.5">
                      <span>
                        {cardType === 'daily'
                          ? 'Hari yang Produktif.'
                          : 'Konsistensi Bulanan.'}
                      </span>
                      <Sparkles className="w-7 h-7 text-emerald-400" />
                    </h1>
                  </div>

                  {/* User Profile Dynamic Pill */}
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(6, 78, 59, 0.25) 100%)',
                      border: '1px solid rgba(0, 242, 254, 0.45)',
                      boxShadow: '0 0 16px rgba(0, 242, 254, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                    }}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
                  >
                    <div
                      style={{
                        background: 'rgba(0, 242, 254, 0.3)',
                        border: '1px solid rgba(0, 242, 254, 0.6)',
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-cyan-200"
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold tracking-wide text-cyan-100 font-mono">
                      {userName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. KARTU PROGRES UTAMA (HERO ELEVATED 3D GLOSSY CARD) */}
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(13, 31, 58, 0.88) 0%, rgba(8, 20, 39, 0.95) 100%)',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  boxShadow:
                    '0 20px 45px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
                }}
                className="rounded-3xl p-6 space-y-3.5 relative overflow-hidden"
              >
                {/* Top Subtle Luminous Shimmer Line */}
                <div
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(0, 242, 254, 0.6) 50%, transparent 100%)',
                  }}
                  className="absolute top-0 left-0 right-0 h-[2px]"
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                    {cardType === 'daily' ? 'PROGRES HARI INI' : 'KONSISTENSI KESELURUHAN'}
                  </span>

                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                    }}
                    className="px-3.5 py-1 rounded-full text-xs font-mono font-bold text-emerald-300"
                  >
                    {cardType === 'daily'
                      ? `${completedDailyActivities}/${totalDailyActivities} TUGAS SELESAI`
                      : `${monthlySummary.totalCompletedChecks}/${monthlySummary.totalEligibleOccurrences} TUGAS SELESAI`}
                  </span>
                </div>

                {/* Percentage Display & Subline */}
                <div className="flex items-baseline gap-4">
                  <div
                    style={{
                      textShadow: '0 0 30px rgba(0, 242, 254, 0.4)',
                    }}
                    className="text-6xl font-black font-mono tracking-tight text-white"
                  >
                    {cardType === 'daily'
                      ? dailyProgressPercent
                      : formatMonthlyProgress(monthlySummary.overallMonthlyProgress)}
                    %
                  </div>

                  <span className="text-sm font-semibold text-emerald-300">
                    {cardType === 'daily'
                      ? headlineMotivation
                      : `${monthlySummary.perfectDaysCount} hari sempurna tercapai bulan ini`}
                  </span>
                </div>

                {/* Luminous Horizontal Progress Bar */}
                <div
                  style={{
                    background: 'rgba(4, 12, 24, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  className="w-full h-4 rounded-full overflow-hidden p-[2px]"
                >
                  <div
                    style={{
                      width: `${
                        cardType === 'daily'
                          ? dailyProgressPercent
                          : Math.min(100, Math.max(0, monthlySummary.overallMonthlyProgress))
                      }%`,
                      background: 'linear-gradient(90deg, #00F2FE 0%, #10B981 100%)',
                      boxShadow:
                        '0 0 16px rgba(16, 185, 129, 0.8), 0 0 8px rgba(0, 242, 254, 0.6)',
                    }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* 3. CARD BODY: DAILY (GRID DUA KOLOM DENGAN HIERARKI BESAR) vs MONTHLY (HEATMAP + REKAP) */}
              {cardType === 'daily' ? (
                <div className="space-y-4">
                  {/* RINCIAN PENCAPAIAN PER KATEGORI (GRID DUA KOLOM - TIPOGRAFI DOMINAN) */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 block">
                      RINCIAN PENCAPAIAN PER KATEGORI
                    </span>

                    {dailyActivities.length === 0 ? (
                      <div
                        style={{
                          background: 'rgba(15, 33, 60, 0.5)',
                          border: '1px dashed rgba(56, 189, 248, 0.3)',
                        }}
                        className="py-10 text-center rounded-2xl text-slate-400 text-sm"
                      >
                        Belum ada aktivitas kebiasaan aktif pada tanggal ini.
                      </div>
                    ) : (
                      /* Grid Dua Kolom dengan Nama Kategori & Persentase Menonjol */
                      <div className="grid grid-cols-2 gap-4">
                        {Array.from(activitiesByCategory.entries()).map(([cat, items]) => {
                          const catVisual = getCategoryVisual(cat);
                          const IconComponent = catVisual.icon;
                          const catCompleted = items.filter((i) => i.isCompleted).length;
                          const catRate =
                            items.length > 0
                              ? Math.round((catCompleted / items.length) * 100)
                              : 0;

                          return (
                            <div
                              key={cat}
                              style={{
                                background:
                                  'linear-gradient(135deg, rgba(13, 31, 58, 0.82) 0%, rgba(8, 20, 39, 0.9) 100%)',
                                border: `1.5px solid ${catVisual.border}`,
                                boxShadow: `0 12px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
                              }}
                              className="rounded-2xl p-4 space-y-3 transition-all"
                            >
                              {/* Header Kategori: NAMA KATEGORI BESAR & PERSENTASE BESAR */}
                              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    style={{
                                      backgroundColor: catVisual.badgeBg,
                                      borderColor: catVisual.border,
                                      color: catVisual.color,
                                      boxShadow: `0 0 12px ${catVisual.glow}`,
                                    }}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center border"
                                  >
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  {/* Nama Kategori Lebih Besar & Tegas */}
                                  <span className="text-base font-black tracking-wide text-white font-mono">
                                    {catVisual.name}
                                  </span>
                                </div>

                                {/* Persentase Lebih Besar & Menonjol */}
                                <span
                                  style={{
                                    color: catVisual.color,
                                    textShadow: `0 0 14px ${catVisual.glow}`,
                                  }}
                                  className="text-2xl font-black font-mono tracking-tight"
                                >
                                  {catRate}%
                                </span>
                              </div>

                              {/* Daftar Tugas: HANYA NAMA TUGAS + CHECKLIST (Tanpa Deskripsi/Keterangan) */}
                              <div className="space-y-1.5 pl-0.5">
                                {items.map((item) => (
                                  <div
                                    key={item.habitId}
                                    className="flex items-center gap-2 text-xs leading-snug"
                                  >
                                    <span
                                      style={{
                                        color: item.isCompleted ? catVisual.color : '#64748B',
                                        textShadow: item.isCompleted
                                          ? `0 0 8px ${catVisual.glow}`
                                          : 'none',
                                      }}
                                      className="font-black shrink-0 text-sm"
                                    >
                                      {item.isCompleted ? '✓' : '○'}
                                    </span>
                                    {/* Nama Tugas Ringkas */}
                                    <span
                                      className={`truncate ${
                                        item.isCompleted
                                          ? 'font-medium text-slate-100'
                                          : 'text-slate-400 italic'
                                      }`}
                                    >
                                      {item.title}
                                    </span>
                                    {!item.isCompleted && (
                                      <span className="text-[10px] text-slate-400 shrink-0">
                                        (Belum)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* KONTRIBUSI PERTUMBUHAN HARI INI */}
                  <div
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(13, 31, 58, 0.72) 0%, rgba(8, 20, 39, 0.85) 100%)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                    }}
                    className="rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                        KONTRIBUSI PERTUMBUHAN HARI INI
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Target Konsistensi Bulanan
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {categoryGrowthDetails.slice(0, 6).map((det) => {
                        const catVisual = getCategoryVisual(det.category);
                        const formattedPoints = det.dailyContributionPoints.toLocaleString(
                          'id-ID',
                          {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          }
                        );

                        return (
                          <div
                            key={det.category}
                            style={{
                              background: 'rgba(6, 16, 32, 0.65)',
                              border: `1px solid ${catVisual.border}`,
                            }}
                            className="p-2.5 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                              <span className="text-slate-300 truncate">{det.category}</span>
                              <span
                                style={{
                                  color: catVisual.color,
                                  textShadow: `0 0 8px ${catVisual.glow}`,
                                }}
                              >
                                {det.dailyContributionPoints > 0 ? `+${formattedPoints} %` : '0,0 %'}
                              </span>
                            </div>

                            {/* Mini Luminous Progress Indicator */}
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                              <div
                                style={{
                                  width: `${Math.min(100, det.cumulativeMonthlyRate)}%`,
                                  backgroundColor: catVisual.color,
                                  boxShadow: `0 0 8px ${catVisual.glow}`,
                                }}
                                className="h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* MONTHLY ACHIEVEMENT CARD CONTENT */
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(13, 31, 58, 0.78) 0%, rgba(8, 20, 39, 0.88) 100%)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
                  }}
                  className="rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                      HEATMAP & REKAP KONSISTENSI BULANAN
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      {monthlySummary.perfectDaysCount} Hari 100% Sempurna
                    </span>
                  </div>

                  {/* Glossy Monthly Heatmap */}
                  <div className="grid grid-cols-7 gap-2">
                    {monthlySummary.calendarDays.map((cd) => {
                      let cellBg = 'rgba(15, 33, 60, 0.5)';
                      let cellText = '#94A3B8';
                      let cellBorder = 'rgba(255, 255, 255, 0.08)';

                      if (cd.status === 'perfect') {
                        cellBg = 'rgba(16, 185, 129, 0.85)';
                        cellText = '#FFFFFF';
                        cellBorder = '#10B981';
                      } else if (cd.status === 'partial') {
                        cellBg = 'rgba(6, 182, 212, 0.7)';
                        cellText = '#FFFFFF';
                        cellBorder = '#06B6D4';
                      } else if (cd.status === 'future') {
                        cellBg = 'transparent';
                        cellText = '#475569';
                      }

                      return (
                        <div
                          key={cd.date}
                          style={{
                            backgroundColor: cellBg,
                            color: cellText,
                            borderColor: cellBorder,
                            borderStyle: cd.status === 'future' ? 'dashed' : 'solid',
                            boxShadow:
                              cd.status === 'perfect'
                                ? '0 0 10px rgba(16, 185, 129, 0.5)'
                                : cd.status === 'partial'
                                ? '0 0 8px rgba(6, 182, 212, 0.4)'
                                : 'none',
                          }}
                          className="h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold border"
                        >
                          {cd.dayNumber}
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Metric Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                    <div
                      style={{
                        background: 'rgba(6, 16, 32, 0.65)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                      className="text-center p-3 rounded-xl"
                    >
                      <span className="text-[11px] font-mono block text-slate-400">
                        Hari Aktif
                      </span>
                      <span className="text-2xl font-black font-mono text-cyan-300">
                        {monthlySummary.activeDaysCount}
                      </span>
                      <span className="text-[10px] block text-slate-400">Minimal 1 Habit</span>
                    </div>

                    <div
                      style={{
                        background: 'rgba(6, 16, 32, 0.65)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                      }}
                      className="text-center p-3 rounded-xl"
                    >
                      <span className="text-[11px] font-mono block text-slate-400">
                        100% Sempurna
                      </span>
                      <span className="text-2xl font-black font-mono text-emerald-400">
                        {monthlySummary.perfectDaysCount}
                      </span>
                      <span className="text-[10px] block text-slate-400">Hari Tanpa Miss</span>
                    </div>

                    <div
                      style={{
                        background: 'rgba(6, 16, 32, 0.65)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                      }}
                      className="text-center p-3 rounded-xl"
                    >
                      <span className="text-[11px] font-mono block text-slate-400">
                        Streak Terbaik
                      </span>
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {monthlySummary.highestStreak}
                      </span>
                      <span className="text-[10px] block text-slate-400">Hari Beruntun</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PESAN MOTIVASI & FOOTER */}
              <div className="space-y-3 pt-2 border-t border-cyan-500/20">
                {/* Pesan Motivasi Bawah */}
                <p className="text-center text-sm italic font-serif leading-relaxed text-slate-300 px-8">
                  {cardType === 'daily' ? bottomMotivationQuote : monthlyMotivationQuote}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest pt-1 text-slate-400">
                  <span className="font-bold text-cyan-400">LIFE OS FUNNEL</span>
                  <span>GROW EVERY DAY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
