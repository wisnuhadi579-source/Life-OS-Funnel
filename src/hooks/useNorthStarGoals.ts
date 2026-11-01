/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NorthStarGoal } from '../types/database';

export function useNorthStarGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<NorthStarGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('north_star_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching north_star_goals:', error);
        setError(error.message);
      } else {
        setGoals((data || []) as NorthStarGoal[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat target North Star.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const coreDriver = goals.find((g) => g.is_core_driver) || null;

  const createGoal = async (
    newGoal: Omit<NorthStarGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    if (goals.length >= 10) {
      return {
        success: false,
        error: 'Batas maksimal 10 target North Star telah tercapai. Hapus atau edit target yang ada.',
      };
    }

    try {
      // If setting as core driver, ensure other goals have is_core_driver = false
      if (newGoal.is_core_driver) {
        await supabase
          .from('north_star_goals')
          .update({ is_core_driver: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      const payload = {
        ...newGoal,
        user_id: user.id,
        sort_order: newGoal.sort_order ?? goals.length,
      };

      const { data, error: insertErr } = await supabase
        .from('north_star_goals')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        console.error('Insert goal error:', insertErr);
        if (insertErr.message.includes('check') || insertErr.message.includes('limit') || insertErr.message.includes('10')) {
          return { success: false, error: 'Batas maksimal 10 target tercapai.' };
        }
        return { success: false, error: insertErr.message };
      }

      await fetchGoals();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat target baru.';
      return { success: false, error: msg };
    }
  };

  const updateGoal = async (
    id: string,
    updates: Partial<NorthStarGoal>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      // If updating to core driver, unset other core drivers first
      if (updates.is_core_driver === true) {
        await supabase
          .from('north_star_goals')
          .update({ is_core_driver: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { error: updateErr } = await supabase
        .from('north_star_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateErr) {
        console.error('Update goal error:', updateErr);
        return { success: false, error: updateErr.message };
      }

      await fetchGoals();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui target.';
      return { success: false, error: msg };
    }
  };

  const setCoreDriver = async (goalId: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      // Unset all first
      await supabase
        .from('north_star_goals')
        .update({ is_core_driver: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      // Set the target goal
      const { error: setErr } = await supabase
        .from('north_star_goals')
        .update({ is_core_driver: true, updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user.id);

      if (setErr) {
        return { success: false, error: setErr.message };
      }

      await fetchGoals();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menetapkan Core Driver.';
      return { success: false, error: msg };
    }
  };

  const deleteGoal = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const { error: delErr } = await supabase
        .from('north_star_goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) {
        return { success: false, error: delErr.message };
      }

      await fetchGoals();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus target.';
      return { success: false, error: msg };
    }
  };

  const reorderGoals = async (reordered: NorthStarGoal[]): Promise<{ success: boolean }> => {
    if (!user) return { success: false };

    // Update local state immediately for fast feedback
    setGoals(reordered);

    try {
      for (let i = 0; i < reordered.length; i++) {
        await supabase
          .from('north_star_goals')
          .update({ sort_order: i })
          .eq('id', reordered[i].id)
          .eq('user_id', user.id);
      }
      return { success: true };
    } catch (err) {
      console.error('Reorder error:', err);
      await fetchGoals(); // Rollback on failure
      return { success: false };
    }
  };

  return {
    goals,
    coreDriver,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    setCoreDriver,
    deleteGoal,
    reorderGoals,
  };
}
