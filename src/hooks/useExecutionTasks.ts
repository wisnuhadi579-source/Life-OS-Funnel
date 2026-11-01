/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ExecutionTask, TaskPriority, TaskStatus, TaskType } from '../types/database';

/**
 * Convert frontend TaskPriority ('high' | 'medium' | 'low') to PostgreSQL integer:
 * 1 = high (P1)
 * 2 = medium (P2)
 * 3 = low (P3)
 */
export function priorityToDb(p: TaskPriority | number | string | undefined | null): number {
  if (typeof p === 'number' && !isNaN(p)) return p;
  if (!p) return 2;
  const str = String(p).toLowerCase().trim();
  if (str === 'high' || str === 'tinggi' || str === '1') return 1;
  if (str === 'low' || str === 'rendah' || str === '3') return 3;
  return 2; // medium
}

/**
 * Convert PostgreSQL integer or string from DB to frontend TaskPriority ('high' | 'medium' | 'low')
 */
export function priorityFromDb(p: any): TaskPriority {
  if (p === 1 || p === '1' || p === 'high' || p === 'tinggi') return 'high';
  if (p === 3 || p === '3' || p === 'low' || p === 'rendah') return 'low';
  return 'medium';
}

export function useExecutionTasks(selectedDate?: string) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDate = selectedDate || new Date().toISOString().split('T')[0];

  const fetchTasks = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('execution_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching execution_tasks:', error);
        setError(error.message);
      } else {
        const normalized = (data || []).map((t: any) => ({
          ...t,
          priority: priorityFromDb(t.priority),
          started_at: t.started_at ?? null,
          deadline_at: t.deadline_at ?? null,
          completed_at: t.completed_at ?? null,
          estimated_minutes: t.estimated_minutes ?? t.estimated_duration ?? 0,
          actual_minutes: t.actual_minutes ?? t.actual_duration ?? 0,
          estimated_duration: t.estimated_minutes ?? t.estimated_duration ?? 0,
          actual_duration: t.actual_minutes ?? t.actual_duration ?? 0,
          recurring_template_id: t.recurring_template_id ?? null,
          recurrence_date: t.recurrence_date ?? null,
        })) as ExecutionTask[];
        setTasks(normalized);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat tugas eksekusi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Combined Rule of 3: Prioritas Hari Ini + Sedang Berjalan <= 3
  const getActiveTasksCount = (date: string, excludeTaskId?: string) => {
    return tasks.filter(
      (t) =>
        (t.status === 'today' || t.status === 'in_progress') &&
        t.scheduled_date === date &&
        t.id !== excludeTaskId
    ).length;
  };

  // Backwards compatibility alias
  const getTodayTasksCount = getActiveTasksCount;

  const createTask = async (
    newTask: Omit<ExecutionTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const taskDate = newTask.scheduled_date || activeDate;

    // RULE OF 3 CHECK: Active tasks (today + in_progress) <= 3
    if (newTask.status === 'today' || newTask.status === 'in_progress') {
      const activeCount = getActiveTasksCount(taskDate);
      if (activeCount >= 3) {
        return {
          success: false,
          error: 'Aturan Rule of 3: Maksimal 3 tugas aktif (Prioritas Hari Ini + Sedang Berjalan) per tanggal agar fokus tetap tajam.',
        };
      }
    }

    try {
      const estMinutes = Number(
        newTask.estimated_minutes !== undefined
          ? newTask.estimated_minutes
          : newTask.estimated_duration !== undefined
          ? newTask.estimated_duration
          : 30
      );

      const actMinutes = Number(
        newTask.actual_minutes !== undefined
          ? newTask.actual_minutes
          : newTask.actual_duration !== undefined
          ? newTask.actual_duration
          : 0
      );

      // CRITICAL: Only include valid Supabase columns for execution_tasks!
      // Do NOT send actual_duration or estimated_duration!
      const payload: Record<string, any> = {
        user_id: user.id,
        title: newTask.title.trim(),
        description: newTask.description || '',
        task_type: newTask.task_type || 'lead_measure',
        status: newTask.status || 'backlog',
        priority: priorityToDb(newTask.priority),
        scheduled_date: taskDate,
        due_date: newTask.due_date || null,
        started_at: newTask.started_at || null,
        deadline_at: newTask.deadline_at || null,
        completed_at: newTask.status === 'done' ? (newTask.completed_at || new Date().toISOString()) : null,
        estimated_minutes: isNaN(estMinutes) ? 30 : estMinutes,
        actual_minutes: isNaN(actMinutes) ? 0 : actMinutes,
        outreach_count: Number(newTask.outreach_count || 0),
        sort_order: Number(newTask.sort_order ?? tasks.length),
        business_key: newTask.business_key || 'general',
      };

      const { data, error: insertErr } = await supabase
        .from('execution_tasks')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        console.error('Task insert error:', insertErr);
        if (insertErr.message.toLowerCase().includes('limit') || insertErr.message.includes('3')) {
          return {
            success: false,
            error: 'Database Trigger: Maksimal 3 tugas diperbolehkan untuk status "Prioritas Hari Ini".',
          };
        }
        return { success: false, error: insertErr.message };
      }

      const inserted = data as any;
      const normalizedTask: ExecutionTask = {
        ...inserted,
        priority: priorityFromDb(inserted.priority),
        started_at: inserted.started_at ?? null,
        deadline_at: inserted.deadline_at ?? null,
        completed_at: inserted.completed_at ?? null,
        estimated_minutes: inserted.estimated_minutes ?? 0,
        actual_minutes: inserted.actual_minutes ?? 0,
        estimated_duration: inserted.estimated_minutes ?? 0,
        actual_duration: inserted.actual_minutes ?? 0,
      };

      setTasks((prev) => [normalizedTask, ...prev]);
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan tugas baru.';
      return { success: false, error: msg };
    }
  };

  const updateTask = async (
    id: string,
    updates: Partial<ExecutionTask>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const targetTask = tasks.find((t) => t.id === id);
    const newStatus = updates.status !== undefined ? updates.status : targetTask?.status;
    const taskDate = updates.scheduled_date || targetTask?.scheduled_date || activeDate;

    // RULE OF 3 CHECK: Active tasks (today + in_progress) <= 3
    const isMovingToActive = newStatus === 'today' || newStatus === 'in_progress';
    const wasAlreadyActive = targetTask?.status === 'today' || targetTask?.status === 'in_progress';
    if (isMovingToActive && !wasAlreadyActive) {
      const count = getActiveTasksCount(taskDate, id);
      if (count >= 3) {
        return {
          success: false,
          error: 'Aturan Rule of 3: Maksimal 3 tugas aktif (Prioritas Hari Ini + Sedang Berjalan) per tanggal. Selesaikan atau pindahkan salah satu tugas terlebih dahulu.',
        };
      }
    }

    try {
      // Build sanitized payload using only valid table columns
      const dbPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) dbPayload.title = updates.title.trim();
      if (updates.description !== undefined) dbPayload.description = updates.description;
      if (updates.task_type !== undefined) dbPayload.task_type = updates.task_type;
      if (updates.status !== undefined) {
        dbPayload.status = updates.status;
        if (updates.status === 'done') {
          dbPayload.completed_at = updates.completed_at || new Date().toISOString();
        } else {
          dbPayload.completed_at = null;
        }
      }
      if (updates.priority !== undefined) {
        dbPayload.priority = priorityToDb(updates.priority);
      }
      if (updates.scheduled_date !== undefined) dbPayload.scheduled_date = updates.scheduled_date;
      if (updates.due_date !== undefined) dbPayload.due_date = updates.due_date;
      if (updates.started_at !== undefined) dbPayload.started_at = updates.started_at;
      if (updates.deadline_at !== undefined) dbPayload.deadline_at = updates.deadline_at;
      if (updates.completed_at !== undefined) dbPayload.completed_at = updates.completed_at;

      if (updates.estimated_minutes !== undefined) {
        dbPayload.estimated_minutes = Number(updates.estimated_minutes);
      } else if (updates.estimated_duration !== undefined) {
        dbPayload.estimated_minutes = Number(updates.estimated_duration);
      }

      if (updates.actual_minutes !== undefined) {
        dbPayload.actual_minutes = Number(updates.actual_minutes);
      } else if (updates.actual_duration !== undefined) {
        dbPayload.actual_minutes = Number(updates.actual_duration);
      }

      if (updates.outreach_count !== undefined) dbPayload.outreach_count = Number(updates.outreach_count);
      if (updates.sort_order !== undefined) dbPayload.sort_order = Number(updates.sort_order);
      if (updates.business_key !== undefined) dbPayload.business_key = updates.business_key;

      const { data, error: updateErr } = await supabase
        .from('execution_tasks')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Task update error:', updateErr);
        return { success: false, error: updateErr.message };
      }

      const updated = data as any;
      const normalizedTask: ExecutionTask = {
        ...updated,
        priority: priorityFromDb(updated.priority),
        started_at: updated.started_at ?? null,
        deadline_at: updated.deadline_at ?? null,
        completed_at: updated.completed_at ?? null,
        estimated_minutes: updated.estimated_minutes ?? 0,
        actual_minutes: updated.actual_minutes ?? 0,
        estimated_duration: updated.estimated_minutes ?? 0,
        actual_duration: updated.actual_minutes ?? 0,
      };

      setTasks((prev) => prev.map((t) => (t.id === id ? normalizedTask : t)));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui tugas.';
      return { success: false, error: msg };
    }
  };

  /**
   * Start task execution timer:
   * Sets started_at = now, calculates deadline_at = started_at + estimated_minutes,
   * changes status to 'in_progress', updates Supabase.
   */
  const startTask = async (
    taskId: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return { success: false, error: 'Tugas tidak ditemukan.' };

    // Cegah double-start jika sudah in_progress dengan deadline aktif
    if (currentTask.status === 'in_progress' && currentTask.deadline_at) {
      return { success: true, error: null };
    }

    const estMinutes = Number(currentTask.estimated_minutes ?? currentTask.estimated_duration ?? 0);
    if (isNaN(estMinutes) || estMinutes <= 0) {
      return {
        success: false,
        error: 'Estimasi durasi belum diisi atau bernilai 0 menit. Silakan edit tugas dan isi estimasi durasi terlebih dahulu sebelum mulai mengerjakan.',
      };
    }

    const now = new Date();
    const startedAt = now.toISOString();
    const deadlineAt = new Date(now.getTime() + estMinutes * 60 * 1000).toISOString();

    const previousTasks = [...tasks];

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'in_progress',
              started_at: startedAt,
              deadline_at: deadlineAt,
              updated_at: startedAt,
            }
          : t
      )
    );

    try {
      const dbPayload = {
        status: 'in_progress',
        started_at: startedAt,
        deadline_at: deadlineAt,
        updated_at: startedAt,
      };

      const { data, error: updateErr } = await supabase
        .from('execution_tasks')
        .update(dbPayload)
        .eq('id', taskId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        setTasks(previousTasks);
        console.error('Task start error:', updateErr);
        return { success: false, error: updateErr.message };
      }

      const updated = data as any;
      const normalizedTask: ExecutionTask = {
        ...updated,
        priority: priorityFromDb(updated.priority),
        started_at: updated.started_at ?? startedAt,
        deadline_at: updated.deadline_at ?? deadlineAt,
        completed_at: updated.completed_at ?? null,
        estimated_minutes: updated.estimated_minutes ?? estMinutes,
        actual_minutes: updated.actual_minutes ?? 0,
        estimated_duration: updated.estimated_minutes ?? estMinutes,
        actual_duration: updated.actual_minutes ?? 0,
      };

      setTasks((prev) => prev.map((t) => (t.id === taskId ? normalizedTask : t)));
      return { success: true, error: null };
    } catch (err: unknown) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Gagal memulai pengerjaan tugas.';
      return { success: false, error: msg };
    }
  };

  const moveTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
    newOrder?: number
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return { success: false, error: 'Tugas tidak ditemukan.' };

    // RULE OF 3 CHECK: Active tasks (today + in_progress) <= 3
    const isMovingToActive = newStatus === 'today' || newStatus === 'in_progress';
    const wasAlreadyActive = currentTask.status === 'today' || currentTask.status === 'in_progress';
    if (isMovingToActive && !wasAlreadyActive) {
      const count = getActiveTasksCount(currentTask.scheduled_date || activeDate, taskId);
      if (count >= 3) {
        return {
          success: false,
          error: 'Aturan Rule of 3: Maksimal 3 tugas aktif (Prioritas Hari Ini + Sedang Berjalan). Selesaikan atau pindahkan tugas lain terlebih dahulu.',
        };
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const isDone = newStatus === 'done';
    const isInProgress = newStatus === 'in_progress';

    let completedAt = currentTask.completed_at ?? null;
    let startedAt = currentTask.started_at ?? null;
    let deadlineAt = currentTask.deadline_at ?? null;
    let actualMinutes = currentTask.actual_minutes ?? 0;

    if (isDone) {
      completedAt = nowIso;
      // Hitung actual_minutes jika started_at tersedia
      if (startedAt) {
        const startMs = new Date(startedAt).getTime();
        const endMs = now.getTime();
        if (!isNaN(startMs) && endMs >= startMs) {
          const diffMin = Math.round((endMs - startMs) / 60000);
          actualMinutes = Math.max(1, diffMin);
        }
      } else if (actualMinutes === 0 && currentTask.estimated_minutes) {
        actualMinutes = currentTask.estimated_minutes;
      }
    } else if (isInProgress) {
      // Jika belum pernah dimulai, set started_at dan deadline_at
      if (!startedAt) {
        const est = Number(currentTask.estimated_minutes ?? currentTask.estimated_duration ?? 0);
        if (isNaN(est) || est <= 0) {
          return {
            success: false,
            error: 'Estimasi durasi belum diisi atau bernilai 0 menit. Silakan isi estimasi durasi terlebih dahulu.',
          };
        }
        startedAt = nowIso;
        deadlineAt = new Date(now.getTime() + est * 60 * 1000).toISOString();
      }
      completedAt = null;
    } else {
      // Moving back to backlog or today
      completedAt = null;
    }

    const previousTasks = [...tasks];

    // Optimistically update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              sort_order: newOrder !== undefined ? newOrder : t.sort_order,
              started_at: startedAt,
              deadline_at: deadlineAt,
              completed_at: completedAt,
              actual_minutes: actualMinutes,
            }
          : t
      )
    );

    try {
      const updatePayload: Record<string, any> = {
        status: newStatus,
        sort_order: newOrder !== undefined ? newOrder : currentTask.sort_order,
        started_at: startedAt,
        deadline_at: deadlineAt,
        completed_at: completedAt,
        actual_minutes: actualMinutes,
        updated_at: nowIso,
      };

      const { error: updateErr } = await supabase
        .from('execution_tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (updateErr) {
        setTasks(previousTasks);
        console.error('Status move error:', updateErr);
        return { success: false, error: updateErr.message };
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      setTasks(previousTasks);
      const msg = err instanceof Error ? err.message : 'Gagal memindahkan status tugas.';
      return { success: false, error: msg };
    }
  };

  /**
   * Complete task helper:
   * Sets completed_at = now, computes actual_minutes, keeps started_at & deadline_at intact.
   */
  const completeTask = async (
    taskId: string
  ): Promise<{ success: boolean; error: string | null }> => {
    return moveTaskStatus(taskId, 'done');
  };

  const deleteTask = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const { error: delErr } = await supabase
        .from('execution_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) {
        return { success: false, error: delErr.message };
      }

      setTasks((prev) => prev.filter((t) => t.id !== id));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus tugas.';
      return { success: false, error: msg };
    }
  };

  /**
   * Automatic Recurring Tasks Generator:
   * Calls the Supabase RPC `life_os_generate_recurring_tasks(p_from_date, p_to_date)`.
   * Defaults to 7-day lookback through today in Asia/Jakarta timezone.
   */
  const generateRecurringTasks = async (
    fromDate?: string,
    toDate?: string
  ): Promise<{ success: boolean; generatedCount: number; error: string | null }> => {
    if (!user || !isSupabaseConfigured()) {
      return { success: false, generatedCount: 0, error: 'Pengguna belum terautentikasi.' };
    }

    try {
      const nowJakarta = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      const pToDate = toDate || nowJakarta;

      let pFromDate = fromDate;
      if (!pFromDate) {
        const past = new Date();
        past.setDate(past.getDate() - 7);
        pFromDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Jakarta',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(past);
      }

      const { data, error: rpcErr } = await supabase.rpc('life_os_generate_recurring_tasks', {
        p_from_date: pFromDate,
        p_to_date: pToDate,
      });

      if (rpcErr) {
        console.error('Error in life_os_generate_recurring_tasks:', rpcErr);
        return { success: false, generatedCount: 0, error: rpcErr.message };
      }

      await fetchTasks();
      const count = typeof data === 'number' ? data : Array.isArray(data) ? data.length : 0;
      return { success: true, generatedCount: count, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengeksekusi pembuatan tugas berulang.';
      return { success: false, generatedCount: 0, error: msg };
    }
  };

  return {
    tasks,
    loading,
    error,
    activeDate,
    refetch: fetchTasks,
    createTask,
    updateTask,
    startTask,
    completeTask,
    moveTaskStatus,
    deleteTask,
    getActiveTasksCount,
    getTodayTasksCount,
    generateRecurringTasks,
  };
}
