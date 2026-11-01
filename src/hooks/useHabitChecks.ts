/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HabitDailyCheck } from '../types/habitTracker';
import { getDaysInMonth } from '../utils/habitMath';

export function useHabitChecks() {
  const { user } = useAuth();
  const [dailyChecks, setDailyChecks] = useState<HabitDailyCheck[]>([]);
  const [monthChecks, setMonthChecks] = useState<HabitDailyCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ambil data checklist untuk satu tanggal spesifik
   */
  const fetchDailyChecks = useCallback(
    async (dateStr: string): Promise<HabitDailyCheck[]> => {
      if (!user || !isSupabaseConfigured() || !dateStr) {
        setDailyChecks([]);
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchErr } = await supabase
          .from('habit_daily_checks')
          .select('*')
          .eq('user_id', user.id)
          .eq('check_date', dateStr);

        if (fetchErr) {
          console.error('Error fetching daily checks:', fetchErr);
          setError(fetchErr.message);
          return [];
        }

        const list = (data || []).map((item) => ({
          ...item,
          notes: item.notes || '',
        })) as HabitDailyCheck[];
        setDailyChecks(list);
        return list;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat status checklist harian.';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Ambil data checklist untuk satu rentang bulan
   */
  const fetchMonthChecks = useCallback(
    async (year: number, month: number): Promise<HabitDailyCheck[]> => {
      if (!user || !isSupabaseConfigured()) {
        setMonthChecks([]);
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        const monthStr = String(month).padStart(2, '0');
        const daysCount = getDaysInMonth(year, month);
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-${String(daysCount).padStart(2, '0')}`;

        const { data, error: fetchErr } = await supabase
          .from('habit_daily_checks')
          .select('*')
          .eq('user_id', user.id)
          .gte('check_date', startDate)
          .lte('check_date', endDate);

        if (fetchErr) {
          console.error('Error fetching month checks:', fetchErr);
          setError(fetchErr.message);
          return [];
        }

        const list = (data || []).map((item) => ({
          ...item,
          notes: item.notes || '',
        })) as HabitDailyCheck[];
        setMonthChecks(list);
        return list;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat histori checklist bulanan.';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Ambil seluruh histori checks (untuk perhitungan streak yang akurat)
   */
  const fetchAllChecks = useCallback(async (): Promise<HabitDailyCheck[]> => {
    if (!user || !isSupabaseConfigured()) return [];

    try {
      const { data, error: fetchErr } = await supabase
        .from('habit_daily_checks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (fetchErr) {
        console.error('Error fetching all checks:', fetchErr);
        return [];
      }

      return (data || []) as HabitDailyCheck[];
    } catch (err) {
      console.error('Error in fetchAllChecks:', err);
      return [];
    }
  }, [user]);

  /**
   * Toggle checklist habit dengan UPSERT ke tabel habit_daily_checks
   * conflict target: habit_id,check_date
   * Memastikan notes selalu bertipe string (''), tidak pernah null (memperbaiki error 23502)
   */
  const toggleHabitCheck = useCallback(
    async (
      habitId: string,
      dateStr: string,
      currentCompleted: boolean,
      existingNotes?: string | null,
      habitMetadata?: {
        title?: string;
        category?: string;
        scheduled_time?: string | null;
      }
    ): Promise<{ success: boolean; is_completed: boolean; error: string | null }> => {
      if (!user || !isSupabaseConfigured()) {
        return { success: false, is_completed: currentCompleted, error: 'Pengguna belum terautentikasi.' };
      }

      const nextStatus = !currentCompleted;
      const nowIso = new Date().toISOString();
      const safeNotes = typeof existingNotes === 'string' ? existingNotes : '';

      // Optimistic update for dailyChecks state
      setDailyChecks((prev) => {
        const index = prev.findIndex((c) => c.habit_id === habitId && c.check_date === dateStr);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            is_completed: nextStatus,
            completed_at: nextStatus ? nowIso : null,
            notes: safeNotes,
            habit_title_snapshot: habitMetadata?.title || updated[index].habit_title_snapshot,
            category_snapshot: habitMetadata?.category || updated[index].category_snapshot,
            scheduled_time_snapshot: habitMetadata?.scheduled_time !== undefined
              ? habitMetadata.scheduled_time
              : updated[index].scheduled_time_snapshot,
            updated_at: nowIso,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              user_id: user.id,
              habit_id: habitId,
              check_date: dateStr,
              is_completed: nextStatus,
              completed_at: nextStatus ? nowIso : null,
              notes: safeNotes,
              habit_title_snapshot: habitMetadata?.title || null,
              category_snapshot: habitMetadata?.category || null,
              scheduled_time_snapshot: habitMetadata?.scheduled_time || null,
              created_at: nowIso,
              updated_at: nowIso,
            },
          ];
        }
      });

      // Optimistic update for monthChecks state
      setMonthChecks((prev) => {
        const index = prev.findIndex((c) => c.habit_id === habitId && c.check_date === dateStr);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            is_completed: nextStatus,
            completed_at: nextStatus ? nowIso : null,
            notes: safeNotes,
            habit_title_snapshot: habitMetadata?.title || updated[index].habit_title_snapshot,
            category_snapshot: habitMetadata?.category || updated[index].category_snapshot,
            scheduled_time_snapshot: habitMetadata?.scheduled_time !== undefined
              ? habitMetadata.scheduled_time
              : updated[index].scheduled_time_snapshot,
            updated_at: nowIso,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              user_id: user.id,
              habit_id: habitId,
              check_date: dateStr,
              is_completed: nextStatus,
              completed_at: nextStatus ? nowIso : null,
              notes: safeNotes,
              habit_title_snapshot: habitMetadata?.title || null,
              category_snapshot: habitMetadata?.category || null,
              scheduled_time_snapshot: habitMetadata?.scheduled_time || null,
              created_at: nowIso,
              updated_at: nowIso,
            },
          ];
        }
      });

      try {
        const payload: Record<string, any> = {
          user_id: user.id,
          habit_id: habitId,
          check_date: dateStr,
          is_completed: nextStatus,
          completed_at: nextStatus ? nowIso : null,
          notes: safeNotes, // Selalu string non-null
          updated_at: nowIso,
        };

        if (habitMetadata) {
          if (habitMetadata.title) {
            payload.habit_title_snapshot = habitMetadata.title;
          }
          if (habitMetadata.category) {
            payload.category_snapshot = habitMetadata.category;
          }
          if (habitMetadata.scheduled_time !== undefined) {
            payload.scheduled_time_snapshot = habitMetadata.scheduled_time || null;
          }
        }

        const { error: upsertErr } = await supabase
          .from('habit_daily_checks')
          .upsert(payload, { onConflict: 'habit_id,check_date' });

        if (upsertErr) {
          console.error('Check upsert error:', upsertErr);
          // Rollback on error
          fetchDailyChecks(dateStr);
          return { success: false, is_completed: currentCompleted, error: upsertErr.message };
        }

        return { success: true, is_completed: nextStatus, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menyimpan checklist.';
        fetchDailyChecks(dateStr);
        return { success: false, is_completed: currentCompleted, error: msg };
      }
    },
    [user, fetchDailyChecks]
  );

  /**
   * Simpan catatan opsional pada checklist
   * Memastikan notes selalu string non-null
   */
  const saveCheckNotes = useCallback(
    async (
      habitId: string,
      dateStr: string,
      notes: string,
      isCompleted: boolean = false,
      habitMetadata?: {
        title?: string;
        category?: string;
        scheduled_time?: string | null;
      }
    ): Promise<{ success: boolean; error: string | null }> => {
      if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

      try {
        const safeNotes = (notes ?? '').trim();
        const payload: Record<string, any> = {
          user_id: user.id,
          habit_id: habitId,
          check_date: dateStr,
          is_completed: isCompleted,
          notes: safeNotes, // Selalu string non-null (''), tidak pernah null
          updated_at: new Date().toISOString(),
        };

        if (habitMetadata) {
          if (habitMetadata.title) payload.habit_title_snapshot = habitMetadata.title;
          if (habitMetadata.category) payload.category_snapshot = habitMetadata.category;
          if (habitMetadata.scheduled_time !== undefined) {
            payload.scheduled_time_snapshot = habitMetadata.scheduled_time || null;
          }
        }

        const { error: upsertErr } = await supabase
          .from('habit_daily_checks')
          .upsert(payload, { onConflict: 'habit_id,check_date' });

        if (upsertErr) {
          return { success: false, error: upsertErr.message };
        }

        // Update local state
        setDailyChecks((prev) =>
          prev.map((c) =>
            c.habit_id === habitId && c.check_date === dateStr ? { ...c, notes: safeNotes } : c
          )
        );

        return { success: true, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menyimpan catatan habit.';
        return { success: false, error: msg };
      }
    },
    [user]
  );

  return {
    dailyChecks,
    monthChecks,
    loading,
    error,
    fetchDailyChecks,
    fetchMonthChecks,
    fetchAllChecks,
    toggleHabitCheck,
    saveCheckNotes,
  };
}
