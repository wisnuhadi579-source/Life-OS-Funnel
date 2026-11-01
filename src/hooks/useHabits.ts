/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { HabitItem } from '../types/habitTracker';
import { getJakartaToday } from '../utils/habitMath';

export const DEFAULT_HABIT_TEMPLATES = [
  {
    title: 'Bangun Pukul 05.00',
    description: 'Memulai hari lebih awal untuk ketenangan batin, doa, dan persiapan hari.',
    category: 'Spiritual',
    color: '#F59E0B',
    icon: 'sun',
    sort_order: 1,
    scheduled_time: '05:00',
  },
  {
    title: 'Olahraga / Peregangan 30 Menit',
    description: 'Aktivitas fisik kardio, lari ringan, atau senam peregangan tubuh.',
    category: 'Health',
    color: '#10B981',
    icon: 'activity',
    sort_order: 2,
    scheduled_time: '06:00',
  },
  {
    title: 'Membaca Buku / Belajar 20 Menit',
    description: 'Menambah wawasan dari buku bisnis, mindset, atau keterampilan baru.',
    category: 'Learning',
    color: '#8B5CF6',
    icon: 'book-open',
    sort_order: 3,
    scheduled_time: '07:00',
  },
  {
    title: 'Eksekusi Konten Promosi Bisnis',
    description: 'Membuat atau mendistribusikan konten promosi harian untuk 3 unit bisnis.',
    category: 'Business',
    color: '#0EA5E9',
    icon: 'trending-up',
    sort_order: 4,
    scheduled_time: '08:30',
  },
  {
    title: 'Evaluasi Keuangan & Jurnal Harian',
    description: 'Mencatat pengeluaran, omset riil, dan refleksi pencapaian harian.',
    category: 'Personal',
    color: '#EC4899',
    icon: 'check-circle',
    sort_order: 5,
    scheduled_time: '20:00',
  },
];

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seedingRef = useRef(false);

  const fetchHabits = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('habit_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchErr) {
        console.error('Error fetching habit_items:', fetchErr);
        setError(fetchErr.message);
        return [];
      }

      const list = (data || []) as HabitItem[];
      setHabits(list);
      return list;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat kebiasaan.';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Seed default 5 habits if user has no habits
  const seedDefaultHabits = useCallback(async () => {
    if (!user || seedingRef.current || !isSupabaseConfigured()) return;
    seedingRef.current = true;

    try {
      const current = await fetchHabits();
      if (current.length === 0) {
        const todayStr = getJakartaToday();
        const payloads = DEFAULT_HABIT_TEMPLATES.map((tmpl) => ({
          user_id: user.id,
          title: tmpl.title,
          description: tmpl.description,
          category: tmpl.category,
          color: tmpl.color,
          icon: tmpl.icon,
          sort_order: tmpl.sort_order,
          scheduled_time: tmpl.scheduled_time || null,
          start_date: todayStr,
          is_active: true,
        }));

        const { error: seedErr } = await supabase
          .from('habit_items')
          .insert(payloads);

        if (seedErr) {
          console.warn('Seed habit_items notice (continuing):', seedErr.message);
        }
        await fetchHabits();
      }
    } catch (err) {
      console.warn('Error during default habits seeding:', err);
      await fetchHabits();
    } finally {
      seedingRef.current = false;
    }
  }, [user, fetchHabits]);

  useEffect(() => {
    seedDefaultHabits();
  }, [seedDefaultHabits]);

  const createHabit = async (
    habit: Omit<HabitItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; data?: HabitItem; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const todayStr = getJakartaToday();
      const payload = {
        user_id: user.id,
        title: habit.title.trim(),
        description: habit.description || null,
        category: habit.category || 'Personal',
        color: habit.color || '#0EA5E9',
        icon: habit.icon || 'check-circle',
        sort_order: habit.sort_order ?? habits.length + 1,
        scheduled_time: habit.scheduled_time ? habit.scheduled_time.trim() : null,
        start_date: habit.start_date || todayStr,
        end_date: habit.end_date || null,
        is_active: habit.is_active !== undefined ? habit.is_active : true,
      };

      const { data, error: insertErr } = await supabase
        .from('habit_items')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }

      const created = data as HabitItem;
      setHabits((prev) => [...prev, created]);
      return { success: true, data: created, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kebiasaan baru.';
      return { success: false, error: msg };
    }
  };

  const updateHabit = async (
    id: string,
    updates: Partial<HabitItem>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;
      if (updates.scheduled_time !== undefined) {
        payload.scheduled_time = updates.scheduled_time ? updates.scheduled_time.trim() : null;
      }
      if (updates.start_date !== undefined) payload.start_date = updates.start_date;
      if (updates.end_date !== undefined) payload.end_date = updates.end_date;
      if (updates.is_active !== undefined) payload.is_active = updates.is_active;

      const { data, error: updateErr } = await supabase
        .from('habit_items')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      const updated = data as HabitItem;
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kebiasaan.';
      return { success: false, error: msg };
    }
  };

  /**
   * Mengarsipkan habit:
   * is_active = false, end_date = hari ini.
   * Histori checklist tetap tersimpan secara permanen.
   */
  const archiveHabit = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    const todayStr = getJakartaToday();
    return updateHabit(id, {
      is_active: false,
      end_date: todayStr,
    });
  };

  /**
   * Mengaktifkan kembali habit yang sebelumnya diarsipkan
   */
  const unarchiveHabit = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    return updateHabit(id, {
      is_active: true,
      end_date: null,
    });
  };

  /**
   * Menghapus habit secara permanen
   */
  const deleteHabit = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      // Hapus daily checks terkait terlebih dahulu
      await supabase
        .from('habit_daily_checks')
        .delete()
        .eq('habit_id', id)
        .eq('user_id', user.id);

      // Hapus habit
      const { error: delErr } = await supabase
        .from('habit_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) {
        return { success: false, error: delErr.message };
      }

      setHabits((prev) => prev.filter((h) => h.id !== id));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kebiasaan.';
      return { success: false, error: msg };
    }
  };

  return {
    habits,
    loading,
    error,
    refetch: fetchHabits,
    createHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
    deleteHabit,
  };
}
