/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HabitDailyReflection } from '../types/habitTracker';

export function useHabitReflection() {
  const { user } = useAuth();
  const [reflection, setReflection] = useState<HabitDailyReflection | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReflection = useCallback(
    async (dateStr: string): Promise<HabitDailyReflection | null> => {
      if (!user || !isSupabaseConfigured() || !dateStr) {
        setReflection(null);
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchErr } = await supabase
          .from('habit_daily_reflections')
          .select('*')
          .eq('user_id', user.id)
          .eq('reflection_date', dateStr)
          .maybeSingle();

        if (fetchErr) {
          console.error('Error fetching habit reflection:', fetchErr);
          setError(fetchErr.message);
          return null;
        }

        const item = (data as HabitDailyReflection) || null;
        setReflection(item);
        return item;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat refleksi harian.';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const saveReflection = useCallback(
    async (
      dateStr: string,
      updates: {
        what_went_well?: string | null;
        obstacles?: string | null;
        tomorrow_plan?: string | null;
        mood?: string | null;
      }
    ): Promise<{ success: boolean; data?: HabitDailyReflection; error: string | null }> => {
      if (!user || !isSupabaseConfigured()) {
        return { success: false, error: 'Pengguna belum terautentikasi.' };
      }

      setSaving(true);
      setError(null);

      try {
        const payload = {
          user_id: user.id,
          reflection_date: dateStr,
          what_went_well: updates.what_went_well !== undefined ? updates.what_went_well : reflection?.what_went_well || null,
          obstacles: updates.obstacles !== undefined ? updates.obstacles : reflection?.obstacles || null,
          tomorrow_plan: updates.tomorrow_plan !== undefined ? updates.tomorrow_plan : reflection?.tomorrow_plan || null,
          mood: updates.mood !== undefined ? updates.mood : reflection?.mood || null,
          updated_at: new Date().toISOString(),
        };

        const { data, error: upsertErr } = await supabase
          .from('habit_daily_reflections')
          .upsert(payload, { onConflict: 'user_id,reflection_date' })
          .select()
          .single();

        if (upsertErr) {
          console.error('Save reflection error:', upsertErr);
          setError(upsertErr.message);
          return { success: false, error: upsertErr.message };
        }

        const saved = data as HabitDailyReflection;
        setReflection(saved);
        return { success: true, data: saved, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menyimpan refleksi harian.';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [user, reflection]
  );

  return {
    reflection,
    loading,
    saving,
    error,
    fetchReflection,
    saveReflection,
  };
}
