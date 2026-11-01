/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MonthlyEvaluation } from '../types/database';

export function useMonthlyEvaluations(selectedMonthStart?: string) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<MonthlyEvaluation[]>([]);
  const [currentEvaluation, setCurrentEvaluation] = useState<MonthlyEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all evaluations for historical charts and summaries
  const fetchAllEvaluations = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('monthly_evaluations')
        .select('*')
        .eq('user_id', user.id)
        .order('month_start', { ascending: true });

      if (fetchErr) {
        console.error('Error fetching monthly_evaluations:', fetchErr);
        setError(fetchErr.message);
      } else {
        const evals = (data || []) as MonthlyEvaluation[];
        setEvaluations(evals);

        if (selectedMonthStart) {
          const match = evals.find((e) => e.month_start === selectedMonthStart);
          setCurrentEvaluation(match || null);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat evaluasi bulanan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonthStart]);

  useEffect(() => {
    fetchAllEvaluations();
  }, [fetchAllEvaluations]);

  // Save or update an evaluation
  const saveEvaluation = async (
    data: Partial<MonthlyEvaluation> & { month_start: string }
  ): Promise<{ success: boolean; data?: MonthlyEvaluation; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      setError(null);
      const payload = {
        ...data,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data: saved, error: upsertErr } = await supabase
        .from('monthly_evaluations')
        .upsert(payload, { onConflict: 'user_id,month_start' })
        .select()
        .single();

      if (upsertErr) {
        console.error('Save evaluation error:', upsertErr);
        return { success: false, error: upsertErr.message };
      }

      await fetchAllEvaluations();
      return { success: true, data: saved as MonthlyEvaluation, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan evaluasi.';
      return { success: false, error: msg };
    }
  };

  return {
    evaluations,
    currentEvaluation,
    loading,
    error,
    refetch: fetchAllEvaluations,
    saveEvaluation,
  };
}
