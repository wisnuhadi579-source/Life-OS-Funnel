/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HabitItem {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: string;
  color: string;
  icon?: string | null;
  sort_order: number;
  scheduled_time?: string | null; // HH:mm format (e.g. '05:00') or null
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HabitDailyCheck {
  id: string;
  user_id: string;
  habit_id: string;
  check_date: string; // YYYY-MM-DD
  is_completed: boolean;
  completed_at?: string | null;
  notes: string; // Always non-null string in database schema (defaults to '')
  habit_title_snapshot?: string | null;
  category_snapshot?: string | null;
  scheduled_time_snapshot?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HabitDailyReflection {
  id: string;
  user_id: string;
  reflection_date: string; // YYYY-MM-DD
  what_went_well?: string | null;
  obstacles?: string | null;
  tomorrow_plan?: string | null;
  mood?: string | null; // 'great' | 'good' | 'neutral' | 'low'
  created_at?: string;
  updated_at?: string;
}

export interface HabitWithStatus extends HabitItem {
  is_completed: boolean;
  completed_at?: string | null;
  notes: string;
  current_streak: number;
  longest_streak: number;
}

export interface HabitMonthPerformance {
  habit: HabitItem;
  completedDays: number;
  eligibleDays: number;
  completionRate: number; // 0 - 100
  currentStreak: number;
  longestStreak: number;
}

export interface CategoryProgressStat {
  category: string;
  completed: number;
  eligible: number;
  percentage: number;
}

export interface CategoryGrowthDetail {
  category: string;
  completedToday: number;
  eligibleToday: number;
  todayRate: number; // 0 - 100
  totalMonthOpportunities: number;
  dailyContributionPoints: number; // e.g. 3.33 (poin persentase)
  cumulativeCompletedUntilDate: number;
  cumulativeEligibleUntilDate: number;
  cumulativeMonthlyRate: number; // 0 - 100 (progres bulanan kumulatif)
  fullMonthTargetProgress: number; // 0 - 100 (terhadap target penuh bulan)
}

export interface DailyActivityItem {
  habitId: string;
  title: string;
  description?: string | null;
  category: string;
  scheduledTime?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  notes: string;
}


export interface MonthlyHabitSummary {
  year: number;
  month: number; // 1 - 12
  monthLabel: string;
  totalEligibleOccurrences: number;
  totalCompletedChecks: number;
  overallMonthlyProgress: number; // 0 - 100 (numeric, rounded to 2 decimals, e.g. 3.33)
  overallMonthlyProgressFormatted: string; // e.g. '3,33' or '50' or '100'
  accumulatedDailyProgress: number; // Total Akumulasi Persentase Progres Harian
  perfectDaysCount: number;
  habitsPerformance: HabitMonthPerformance[];
  calendarDays: CalendarDayStatus[];
  categoryStats: CategoryProgressStat[];
  bestConsistencyHabit?: HabitItem | null;
  highestStreak: number;
  activeDaysCount: number; // Days with at least 1 habit completed
}

export interface CalendarDayStatus {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isPastOrToday: boolean;
  isToday: boolean;
  totalEligible: number;
  totalCompleted: number;
  completionRate: number; // 0 - 100
  status: 'perfect' | 'partial' | 'zero' | 'future';
}

export type HabitTrackerMode = 'daily' | 'monthly';

export type AchievementCardType = 'daily' | 'monthly';
export type AchievementCardTheme = 'midnight' | 'minimal' | 'aurora';

