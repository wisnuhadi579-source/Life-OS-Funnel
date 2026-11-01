/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  HabitItem,
  HabitDailyCheck,
  CalendarDayStatus,
  HabitMonthPerformance,
  MonthlyHabitSummary,
  CategoryProgressStat,
  CategoryGrowthDetail,
  DailyActivityItem,
} from '../types/habitTracker';

export const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Dapatkan tanggal hari ini dalam zona waktu Asia/Jakarta (format YYYY-MM-DD)
 */
export function getJakartaToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Format tanggal string YYYY-MM-DD ke teks bahasa Indonesia (Asia/Jakarta)
 */
export function formatJakartaDate(
  dateStr: string,
  includeDay: boolean = true
): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: includeDay ? 'long' : undefined,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Geser tanggal YYYY-MM-DD sebanyak n hari
 */
export function shiftDate(dateStr: string, daysDelta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d + daysDelta, 12, 0, 0));
  return dateObj.toISOString().split('T')[0];
}

/**
 * Hitung jumlah hari dalam bulan tertentu (1-12)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Cek apakah sebuah habit berlaku/eligible pada tanggal target (YYYY-MM-DD)
 */
export function isHabitEligibleOnDate(habit: HabitItem, targetDate: string): boolean {
  if (!habit.start_date) return false;
  if (targetDate < habit.start_date) return false;

  // Jika memiliki end_date
  if (habit.end_date && targetDate > habit.end_date) {
    return false;
  }

  // Jika tidak aktif dan tidak ada end_date, anggap tidak berlaku
  if (!habit.is_active && !habit.end_date) {
    return false;
  }

  return true;
}

/**
 * Hitung Current Streak dan Longest Streak untuk satu habit
 */
export function computeHabitStreaks(
  habit: HabitItem,
  completedDatesSet: Set<string>,
  todayStr: string = getJakartaToday()
): { currentStreak: number; longestStreak: number } {
  const startDate = habit.start_date;
  const endDate = habit.end_date && habit.end_date < todayStr ? habit.end_date : todayStr;

  if (startDate > endDate) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Current Streak calculation:
  // Hitung mundur mulai dari todayStr
  let currentStreak = 0;
  const isTodayCompleted = completedDatesSet.has(todayStr);

  if (isTodayCompleted) {
    currentStreak = 1;
    let checkDate = shiftDate(todayStr, -1);
    while (checkDate >= startDate) {
      if (completedDatesSet.has(checkDate)) {
        currentStreak++;
        checkDate = shiftDate(checkDate, -1);
      } else {
        break;
      }
    }
  } else {
    // Hari ini belum dicentang, cek apakah kemarin selesai
    const yesterday = shiftDate(todayStr, -1);
    if (yesterday >= startDate && completedDatesSet.has(yesterday)) {
      currentStreak = 1;
      let checkDate = shiftDate(yesterday, -1);
      while (checkDate >= startDate) {
        if (completedDatesSet.has(checkDate)) {
          currentStreak++;
          checkDate = shiftDate(checkDate, -1);
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // 2. Longest Streak calculation:
  // Scan urut dari start_date ke endDate
  let longestStreak = 0;
  let runningStreak = 0;
  let iterDate = startDate;

  while (iterDate <= endDate) {
    if (isHabitEligibleOnDate(habit, iterDate)) {
      if (completedDatesSet.has(iterDate)) {
        runningStreak++;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
    iterDate = shiftDate(iterDate, 1);
  }

  return { currentStreak, longestStreak };
}

/**
 * Pengurutan Habit Berdasarkan Jadwal:
 * 1. scheduled_time paling awal
 * 2. Habit tanpa jadwal ditempatkan paling bawah
 * 3. Jika jam sama, gunakan sort_order
 * 4. Jika sort_order sama, gunakan created_at
 */
export function sortHabitsBySchedule(a: HabitItem, b: HabitItem): number {
  const timeA = a.scheduled_time?.trim() || '';
  const timeB = b.scheduled_time?.trim() || '';

  if (timeA && timeB) {
    if (timeA !== timeB) return timeA.localeCompare(timeB);
  } else if (timeA && !timeB) {
    return -1; // a ada jadwal, letakkan di atas
  } else if (!timeA && timeB) {
    return 1; // b ada jadwal, letakkan di atas
  }

  // Jika jadwal sama atau keduanya tidak punya jadwal: sort_order
  const orderA = a.sort_order ?? 999;
  const orderB = b.sort_order ?? 999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  // Jika sort_order sama: created_at
  const createdA = a.created_at || '';
  const createdB = b.created_at || '';
  return createdA.localeCompare(createdB);
}

/**
 * Format string waktu HH:mm (contoh '05:00:00' atau '05:00' -> '05:00')
 */
export function formatScheduledTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
}

/**
 * Hitung statistik progres per kategori secara akurat
 * Menggunakan category_snapshot dari checklist historis, dengan fallback ke habit.category
 */
export function calculateCategoryStats(
  habits: HabitItem[],
  checks: HabitDailyCheck[],
  startDateStr: string,
  endDateStr: string,
  todayStr: string = getJakartaToday()
): CategoryProgressStat[] {
  // Batasi rentang tanggal agar tidak menghitung masa depan
  const effectiveEnd = endDateStr > todayStr ? todayStr : endDateStr;
  if (startDateStr > effectiveEnd) return [];

  // Index habits by id
  const habitMap = new Map<string, HabitItem>();
  habits.forEach((h) => habitMap.set(h.id, h));

  // Ambil semua kategori unik dari habit_items dan checks
  const allCategories = new Set<string>();
  habits.forEach((h) => {
    if (h.category) allCategories.add(h.category);
  });
  checks.forEach((c) => {
    if (c.category_snapshot) allCategories.add(c.category_snapshot);
  });

  const eligibleByCategory: Record<string, number> = {};
  const completedByCategory: Record<string, number> = {};

  allCategories.forEach((cat) => {
    eligibleByCategory[cat] = 0;
    completedByCategory[cat] = 0;
  });

  // Iterasi setiap hari dalam rentang tanggal
  let curDate = startDateStr;
  while (curDate <= effectiveEnd) {
    // Cari habit eligible di hari ini
    const eligibleToday = habits.filter((h) => isHabitEligibleOnDate(h, curDate));
    eligibleToday.forEach((h) => {
      const cat = h.category || 'Lainnya';
      eligibleByCategory[cat] = (eligibleByCategory[cat] || 0) + 1;
    });

    curDate = shiftDate(curDate, 1);
  }

  // Hitung completed checks dalam rentang
  checks.forEach((c) => {
    if (c.is_completed && c.check_date >= startDateStr && c.check_date <= effectiveEnd) {
      const habit = habitMap.get(c.habit_id);
      const cat = c.category_snapshot || habit?.category || 'Lainnya';
      completedByCategory[cat] = (completedByCategory[cat] || 0) + 1;
    }
  });

  const result: CategoryProgressStat[] = Array.from(allCategories).map((cat) => {
    const eligible = eligibleByCategory[cat] || 0;
    const completed = completedByCategory[cat] || 0;
    const percentage = eligible > 0 ? Math.round((completed / eligible) * 100) : 0;
    return {
      category: cat,
      completed,
      eligible,
      percentage,
    };
  });

  // Filter kategori yang memiliki minimal 1 eligible occurrence atau completed check
  return result
    .filter((r) => r.eligible > 0 || r.completed > 0)
    .sort((a, b) => b.percentage - a.percentage);
}

/**
 * Format persentase progres bulanan sesuai standar aplikasi (Bahasa Indonesia)
 * Contoh: 3.33 -> '3,33', 1.67 -> '1,67', 50 -> '50', 100 -> '100'
 */
export function formatMonthlyProgress(value: number): string {
  if (value === 0) return '0';
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

/**
 * Hitung statistik bulanan menyeluruh (Monthly Progress, Performance per Habit, Kalender, dsb)
 * Sesuai rumus resmi:
 * Progress Bulanan = Total Akumulasi Persentase Progres Harian / Jumlah Hari Kalender dalam Bulan
 */
export function calculateMonthlyHabitSummary(
  habits: HabitItem[],
  checks: HabitDailyCheck[],
  year: number,
  month: number, // 1 - 12
  todayStr: string = getJakartaToday()
): MonthlyHabitSummary {
  const daysInMonth = getDaysInMonth(year, month);
  const monthStr = String(month).padStart(2, '0');
  const monthLabel = `${INDONESIAN_MONTH_NAMES[month - 1]} ${year}`;
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

  // Index checks by habit_id -> Set of completed dates
  const checksByHabit = new Map<string, Set<string>>();
  const checksByDate = new Map<string, Set<string>>();

  checks.forEach((c) => {
    if (c.is_completed) {
      // By habit
      if (!checksByHabit.has(c.habit_id)) {
        checksByHabit.set(c.habit_id, new Set());
      }
      checksByHabit.get(c.habit_id)!.add(c.check_date);

      // By date (Set mencegah duplikasi pencatatan pada tanggal yang sama)
      if (!checksByDate.has(c.check_date)) {
        checksByDate.set(c.check_date, new Set());
      }
      checksByDate.get(c.check_date)!.add(c.habit_id);
    }
  });

  // Tentukan apakah bulan ini adalah bulan berjalan (atau bulan masa lalu / masa depan)
  const isFutureMonth = `${year}-${monthStr}` > todayStr.slice(0, 7);

  // A. Kalender Bulanan & Penghitungan Overall
  const calendarDays: CalendarDayStatus[] = [];
  let totalEligibleOccurrences = 0;
  let totalCompletedChecks = 0;
  let perfectDaysCount = 0;
  let activeDaysCount = 0;
  let accumulatedDailyProgress = 0; // Akumulasi persentase harian

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const isPastOrToday = dateStr <= todayStr;
    const isToday = dateStr === todayStr;

    // Cari habit yang berlaku di tanggal ini
    const eligibleHabits = habits.filter((h) => isHabitEligibleOnDate(h, dateStr));
    const completedSetForDate = checksByDate.get(dateStr) || new Set();

    // Hitung yang completed dan eligible tanpa duplikasi
    let completedCount = 0;
    eligibleHabits.forEach((h) => {
      if (completedSetForDate.has(h.id)) {
        completedCount++;
      }
    });

    const eligibleCount = eligibleHabits.length;

    // Rumus Progres Harian:
    // (jumlah habit selesai hari ini / total habit aktif hari ini) * 100%
    // Aturan: Jika tidak ada habit aktif pada suatu hari, tangani secara aman tanpa pembagian dengan nol (0%).
    const dailyProgressRate =
      eligibleCount > 0 ? (completedCount / eligibleCount) * 100 : 0;
    const rate = Math.round(dailyProgressRate);

    let status: 'perfect' | 'partial' | 'zero' | 'future' = 'zero';
    if (!isPastOrToday) {
      status = 'future';
    } else if (eligibleCount === 0) {
      status = 'zero';
    } else if (completedCount === eligibleCount && eligibleCount > 0) {
      status = 'perfect';
      perfectDaysCount++;
    } else if (completedCount > 0) {
      status = 'partial';
    } else {
      status = 'zero';
    }

    if (completedCount > 0) {
      activeDaysCount++;
    }

    // Akumulasi kesempatan checklist dan checklist selesai sepanjang bulan kalender penuh
    totalEligibleOccurrences += eligibleCount;
    totalCompletedChecks += completedCount;

    // Akumulasi persentase progres harian untuk rumus Progress Bulanan.
    // Hari yang belum memiliki checklist tetap dihitung sebagai 0%, bukan diabaikan.
    accumulatedDailyProgress += dailyProgressRate;

    calendarDays.push({
      date: dateStr,
      dayNumber: day,
      isPastOrToday,
      isToday,
      totalEligible: eligibleCount,
      totalCompleted: completedCount,
      completionRate: rate,
      status,
    });
  }

  // B. Rumus Resmi Progress Bulanan:
  // Progress Bulanan = Total Akumulasi Persentase Progres Harian / Jumlah Hari Kalender dalam Bulan
  // Contoh November (30 hari):
  // - 1 hari 100%, 29 hari 0% = 100 / 30 = 3,33%
  // - 15 hari 100%, 15 hari 0% = 1500 / 30 = 50%
  // - 30 hari 100% = 3000 / 30 = 100%
  // - 1 hari 50%, 29 hari 0% = 50 / 30 = 1,67%
  const rawMonthlyProgress = daysInMonth > 0 ? accumulatedDailyProgress / daysInMonth : 0;
  const overallMonthlyProgress = Math.round(rawMonthlyProgress * 100) / 100;
  const overallMonthlyProgressFormatted = formatMonthlyProgress(overallMonthlyProgress);

  // C. Performance per Habit
  const habitsPerformance: HabitMonthPerformance[] = habits.map((habit) => {
    const completedSet = checksByHabit.get(habit.id) || new Set();

    // Hitung hari berlaku dalam bulan kalender ini
    let habitEligibleDays = 0;
    let habitCompletedDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      if (isHabitEligibleOnDate(habit, dateStr)) {
        habitEligibleDays++;
        if (completedSet.has(dateStr)) {
          habitCompletedDays++;
        }
      }
    }

    const completionRate =
      habitEligibleDays > 0
        ? Math.round((habitCompletedDays / habitEligibleDays) * 100)
        : 0;

    const { currentStreak, longestStreak } = computeHabitStreaks(habit, completedSet, todayStr);

    return {
      habit,
      completedDays: habitCompletedDays,
      eligibleDays: habitEligibleDays,
      completionRate,
      currentStreak,
      longestStreak,
    };
  });

  // Sort by completionRate descending
  habitsPerformance.sort((a, b) => b.completionRate - a.completionRate);

  // Best habit & Highest streak
  const bestConsistencyHabit =
    habitsPerformance.length > 0 && habitsPerformance[0].eligibleDays > 0
      ? habitsPerformance[0].habit
      : null;

  let highestStreak = 0;
  habitsPerformance.forEach((hp) => {
    if (hp.longestStreak > highestStreak) highestStreak = hp.longestStreak;
    if (hp.currentStreak > highestStreak) highestStreak = hp.currentStreak;
  });

  // Category stats
  const categoryStats = calculateCategoryStats(habits, checks, startDate, endDate, todayStr);

  return {
    year,
    month,
    monthLabel,
    totalEligibleOccurrences,
    totalCompletedChecks,
    overallMonthlyProgress,
    overallMonthlyProgressFormatted,
    accumulatedDailyProgress,
    perfectDaysCount,
    habitsPerformance,
    calendarDays,
    categoryStats,
    bestConsistencyHabit,
    highestStreak,
    activeDaysCount,
  };
}

/**
 * Mengambil daftar aktivitas harian dengan snapshot nama, kategori, dan status selesai
 */
export function calculateDailyActivities(
  habits: HabitItem[],
  dailyChecks: HabitDailyCheck[],
  selectedDate: string
): DailyActivityItem[] {
  const eligibleHabits = habits
    .filter((h) => isHabitEligibleOnDate(h, selectedDate))
    .sort(sortHabitsBySchedule);

  const checksMap = new Map<string, HabitDailyCheck>();
  dailyChecks.forEach((c) => {
    if (c.check_date === selectedDate) {
      checksMap.set(c.habit_id, c);
    }
  });

  return eligibleHabits.map((h) => {
    const c = checksMap.get(h.id);
    return {
      habitId: h.id,
      title: c?.habit_title_snapshot || h.title,
      description: h.description || null,
      category: c?.category_snapshot || h.category || 'Lainnya',
      scheduledTime: c?.scheduled_time_snapshot !== undefined ? c.scheduled_time_snapshot : h.scheduled_time,
      isCompleted: c ? c.is_completed : false,
      completedAt: c?.completed_at || null,
      notes: c?.notes || '',
    };
  });
}

/**
 * Menghitung Kontribusi Pertumbuhan Harian per Kategori terhadap Target Konsistensi Bulanan
 * Sesuai rumus resmi:
 * A. Progres Harian = (Checklist Selesai Hari Ini / Habit Aktif Dijadwalkan Hari Ini) * 100%
 * B. Kontribusi Harian = (Checklist Selesai Kategori Hari Ini / Total Kesempatan Checklist Kategori Sebulan Penuh) * 100%
 * C. Progres Bulanan Kumulatif = (Checklist Selesai Sejak Awal Bulan / Total Kesempatan Sampai Tanggal Evaluasi) * 100%
 * D. Target Penuh Bulan = (Checklist Selesai Sejak Awal Bulan / Total Kesempatan Sebulan Penuh) * 100%
 */
export function calculateCategoryGrowthDetails(
  habits: HabitItem[],
  monthChecks: HabitDailyCheck[],
  selectedDate: string
): CategoryGrowthDetail[] {
  const [yearStr, monthStr, dayStr] = selectedDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const selectedDay = Number(dayStr);
  const daysInMonth = getDaysInMonth(year, month);
  const monthStart = `${yearStr}-${monthStr}-01`;

  // Map habits
  const habitMap = new Map<string, HabitItem>();
  habits.forEach((h) => habitMap.set(h.id, h));

  // Ambil semua kategori unik
  const allCategories = new Set<string>();
  habits.forEach((h) => {
    if (h.category) allCategories.add(h.category);
  });
  monthChecks.forEach((c) => {
    if (c.category_snapshot) allCategories.add(c.category_snapshot);
  });

  const details: CategoryGrowthDetail[] = [];

  allCategories.forEach((cat) => {
    // 1. Hari ini: Habit eligible & checks
    const eligibleHabitsToday = habits.filter(
      (h) => (h.category || 'Lainnya') === cat && isHabitEligibleOnDate(h, selectedDate)
    );
    const eligibleToday = eligibleHabitsToday.length;

    let completedToday = 0;
    monthChecks.forEach((c) => {
      if (c.check_date === selectedDate && c.is_completed) {
        const itemCat = c.category_snapshot || habitMap.get(c.habit_id)?.category || 'Lainnya';
        if (itemCat === cat) {
          completedToday++;
        }
      }
    });

    const todayRate = eligibleToday > 0 ? Math.round((completedToday / eligibleToday) * 100) : 0;

    // 2. Total Kesempatan Checklist Selama Satu Bulan Penuh (1..daysInMonth)
    let totalMonthOpportunities = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
      const habitsOnDay = habits.filter(
        (h) => (h.category || 'Lainnya') === cat && isHabitEligibleOnDate(h, dStr)
      );
      totalMonthOpportunities += habitsOnDay.length;
    }

    // Kontribusi Harian = (completedToday / totalMonthOpportunities) * 100%
    const dailyContributionPoints =
      totalMonthOpportunities > 0 ? (completedToday / totalMonthOpportunities) * 100 : 0;

    // 3. Progres Bulanan Kumulatif (dari tgl 1 sampai selectedDate)
    let cumulativeEligibleUntilDate = 0;
    for (let d = 1; d <= selectedDay; d++) {
      const dStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
      const habitsOnDay = habits.filter(
        (h) => (h.category || 'Lainnya') === cat && isHabitEligibleOnDate(h, dStr)
      );
      cumulativeEligibleUntilDate += habitsOnDay.length;
    }

    let cumulativeCompletedUntilDate = 0;
    monthChecks.forEach((c) => {
      if (c.is_completed && c.check_date >= monthStart && c.check_date <= selectedDate) {
        const itemCat = c.category_snapshot || habitMap.get(c.habit_id)?.category || 'Lainnya';
        if (itemCat === cat) {
          cumulativeCompletedUntilDate++;
        }
      }
    });

    const cumulativeMonthlyRate =
      cumulativeEligibleUntilDate > 0
        ? Math.round((cumulativeCompletedUntilDate / cumulativeEligibleUntilDate) * 100)
        : 0;

    const fullMonthTargetProgress =
      totalMonthOpportunities > 0
        ? Math.round((cumulativeCompletedUntilDate / totalMonthOpportunities) * 100)
        : 0;

    // Sertakan jika kategori memiliki kebiasaan aktif atau riwayat
    if (totalMonthOpportunities > 0 || eligibleToday > 0 || completedToday > 0) {
      details.push({
        category: cat,
        completedToday,
        eligibleToday,
        todayRate,
        totalMonthOpportunities,
        dailyContributionPoints,
        cumulativeCompletedUntilDate,
        cumulativeEligibleUntilDate,
        cumulativeMonthlyRate,
        fullMonthTargetProgress,
      });
    }
  });

  return details.sort((a, b) => b.dailyContributionPoints - a.dailyContributionPoints || a.category.localeCompare(b.category));
}


