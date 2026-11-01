/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { RecurringTaskTemplate, TaskPriority, TaskType } from '../types/database';
import { priorityToDb, priorityFromDb } from './useExecutionTasks';

export const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
  7: 'Minggu',
};

export interface DefaultTemplateItem {
  title: string;
  description: string;
  business_key: 'jamu_herbal' | 'akademi_spiritual' | 'pakar_digital';
  day_of_week: number;
  task_type: TaskType;
  priority: TaskPriority;
  estimated_minutes: number;
  outreach_count?: number;
}

/**
 * 15 Template Task Awal Rutinitas Promosi Konten Mingguan (Senin-Jumat, 3 Bisnis)
 * Sabtu & Minggu: Libur
 */
export const DEFAULT_RECURRING_TEMPLATES: DefaultTemplateItem[] = [
  // SENIN (Hari 1): Riset Konten Promosi (Support Task)
  {
    day_of_week: 1,
    title: 'Riset Konten Promosi Jamu Herbal',
    description: 'Riset topik tren herbal, testimoni konsumen, dan konten edukasi khasiat produk jamu alami.\n- Cek tren kesehatan & tips hidup sehat di TikTok / IG Reels.\n- Kumpulkan referensi hook & angle promosi herbal.',
    business_key: 'jamu_herbal',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 45,
    outreach_count: 0,
  },
  {
    day_of_week: 1,
    title: 'Riset Konten Promosi Akademi Spiritual',
    description: 'Riset tema kesadaran diri, meditasi harian, ketenangan batin, dan spiritualitas praktis.\n- Kumpulkan pertanyaan dari komunitas / peserta sesi lalu.\n- Susun poin refleksi yang menyentuh kebutuhan batin audiens.',
    business_key: 'akademi_spiritual',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 45,
    outreach_count: 0,
  },
  {
    day_of_week: 1,
    title: 'Riset Konten Promosi Pakar Digital',
    description: 'Riset tren digital marketing, strategi funneling, otomasi bisnis, dan tips AI produktivitas.\n- Cek studi kasus terbaru konversi landing page & sales funnels.\n- Simpan referensi carousel dan visual framework.',
    business_key: 'pakar_digital',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 45,
    outreach_count: 0,
  },

  // SELASA (Hari 2): Membuat Skrip Konten (Support Task)
  {
    day_of_week: 2,
    title: 'Membuat Skrip Konten Jamu Herbal',
    description: 'Tulis hook menarik, problem-solution storytelling, dan call to action (CTA) pembelian Jamu Herbal.\n- Format: 3 detik hook, 20 detik problem & solusi, 7 detik CTA link WhatsApp order.',
    business_key: 'jamu_herbal',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 45,
    outreach_count: 0,
  },
  {
    day_of_week: 2,
    title: 'Membuat Skrip Konten Akademi Spiritual',
    description: 'Tulis naskah konten pencerahan, kutipan reflektif, dan ajakan bergabung ke membership Akademi Spiritual.\n- Nada bicara: menenangkan, hangat, bijaksana, dan membebaskan keraguan.',
    business_key: 'akademi_spiritual',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 45,
    outreach_count: 0,
  },
  {
    day_of_week: 2,
    title: 'Membuat Skrip Konten Pakar Digital',
    description: 'Tulis skrip edukasi funnel, breakdown studi kasus optimasi konversi, dan penawaran workshop/konsultasi.\n- Struktur: Breakdown framework langkah demi langkah yang actionable.',
    business_key: 'pakar_digital',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 45,
    outreach_count: 0,
  },

  // RABU (Hari 3): Rekaman Konten (Support Task)
  {
    day_of_week: 3,
    title: 'Rekaman Konten Jamu Herbal',
    description: 'Take video proses seduh, visual botol kemasan, dan penjelasan manfaat kesehatan higienis.\n- Rekam b-roll penuangan jamu segar dan ekspresi menikmati khasiatnya.',
    business_key: 'jamu_herbal',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 60,
    outreach_count: 0,
  },
  {
    day_of_week: 3,
    title: 'Rekaman Konten Akademi Spiritual',
    description: 'Take video sharing wisdom, panduan latihan pernapasan, dan pesan inspiratif mingguan.\n- Pastikan pencahayaan natural dan suasana hening yang khidmat.',
    business_key: 'akademi_spiritual',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 60,
    outreach_count: 0,
  },
  {
    day_of_week: 3,
    title: 'Rekaman Konten Pakar Digital',
    description: 'Screen recording tutorial tools, insight dashboard analitik, dan presentasi framework digital.\n- Tunjukkan demonstrasi praktis penerapan sales funnel langsung.',
    business_key: 'pakar_digital',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 60,
    outreach_count: 0,
  },

  // KAMIS (Hari 4): Editing Konten (Support Task)
  {
    day_of_week: 4,
    title: 'Editing Konten Jamu Herbal',
    description: 'Cut video, tambahkan subtitle dinamis, visual B-roll herbal, dan musik latar santai.\n- Pastikan logo Jamu Herbal dan badge alami terlihat jelas.',
    business_key: 'jamu_herbal',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 60,
    outreach_count: 0,
  },
  {
    day_of_week: 4,
    title: 'Editing Konten Akademi Spiritual',
    description: 'Color grading bernuansa tenang, audio jernih, typography elegan, dan transisi halus.\n- Tambahkan subtitle dengan tipografi lembut dan font yang mudah dibaca.',
    business_key: 'akademi_spiritual',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 60,
    outreach_count: 0,
  },
  {
    day_of_week: 4,
    title: 'Editing Konten Pakar Digital',
    description: 'Edit video ritme cepat, infografis pendukung, zoom punch, dan teks sorotan penting.\n- Siapkan format vertikal (9:16) untuk Reels/TikTok dan format kotak untuk Feed/Carousel.',
    business_key: 'pakar_digital',
    task_type: 'support_task',
    priority: 'high',
    estimated_minutes: 60,
    outreach_count: 0,
  },

  // JUMAT (Hari 5): Jadwalkan & Publikasikan Konten (Lead Measure — Tindakan Eksekusi Nyata)
  {
    day_of_week: 5,
    title: 'Jadwalkan & Publikasikan Konten Jamu Herbal',
    description: 'Upload & publish reels/TikTok/shorts jamu herbal dengan hashtag relevan dan link WhatsApp order.\n- Segera balas komentar dan DM masuk calon pembeli botol jamu.',
    business_key: 'jamu_herbal',
    task_type: 'lead_measure',
    priority: 'high',
    estimated_minutes: 30,
    outreach_count: 5,
  },
  {
    day_of_week: 5,
    title: 'Jadwalkan & Publikasikan Konten Akademi Spiritual',
    description: 'Upload reels/post spiritual, pin komentar link pendaftaran komunitas, dan pantau engagement.\n- Lakukan direct outreach ke 5 prospek member yang berinteraksi di story/post.',
    business_key: 'akademi_spiritual',
    task_type: 'lead_measure',
    priority: 'high',
    estimated_minutes: 30,
    outreach_count: 5,
  },
  {
    day_of_week: 5,
    title: 'Jadwalkan & Publikasikan Konten Pakar Digital',
    description: 'Jadwalkan distribusi konten omnichannel, bagikan carousel edukasi ke LinkedIn & IG, pantau DM leads.\n- Follow up langsung 5 calon klien konsultasi / pembeli produk digital.',
    business_key: 'pakar_digital',
    task_type: 'lead_measure',
    priority: 'high',
    estimated_minutes: 30,
    outreach_count: 5,
  },
];

export function useRecurringTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('recurring_task_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchErr) {
        console.error('Error fetching recurring_task_templates:', fetchErr);
        setError(fetchErr.message);
      } else {
        const normalized = (data || []).map((t: any) => ({
          ...t,
          priority: priorityFromDb(t.priority),
          day_of_week: Number(t.day_of_week),
          estimated_minutes: Number(t.estimated_minutes || 30),
          is_active: t.is_active ?? true,
        })) as RecurringTaskTemplate[];
        setTemplates(normalized);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat template tugas berulang.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (
    template: Omit<RecurringTaskTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error: string | null; data?: RecurringTaskTemplate }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const payload: Record<string, any> = {
        user_id: user.id,
        title: template.title.trim(),
        description: template.description || '',
        business_key: template.business_key || 'general',
        day_of_week: Number(template.day_of_week),
        task_type: template.task_type || 'support_task',
        priority: priorityToDb(template.priority),
        estimated_minutes: Number(template.estimated_minutes || 30),
        is_active: template.is_active !== undefined ? template.is_active : true,
        outreach_count: Number(template.outreach_count || 0),
        sort_order: Number(template.sort_order ?? templates.length),
        start_date: template.start_date || null,
        end_date: template.end_date || null,
      };

      const { data, error: insertErr } = await supabase
        .from('recurring_task_templates')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        console.error('Template insert error:', insertErr);
        return { success: false, error: insertErr.message };
      }

      const item = data as any;
      const normalized: RecurringTaskTemplate = {
        ...item,
        priority: priorityFromDb(item.priority),
        day_of_week: Number(item.day_of_week),
        estimated_minutes: Number(item.estimated_minutes || 30),
        is_active: item.is_active ?? true,
      };

      setTemplates((prev) => [...prev, normalized]);
      return { success: true, error: null, data: normalized };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambah template tugas berulang.';
      return { success: false, error: msg };
    }
  };

  const updateTemplate = async (
    id: string,
    updates: Partial<RecurringTaskTemplate>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.business_key !== undefined) payload.business_key = updates.business_key;
      if (updates.day_of_week !== undefined) payload.day_of_week = Number(updates.day_of_week);
      if (updates.task_type !== undefined) payload.task_type = updates.task_type;
      if (updates.priority !== undefined) payload.priority = priorityToDb(updates.priority);
      if (updates.estimated_minutes !== undefined) payload.estimated_minutes = Number(updates.estimated_minutes);
      if (updates.is_active !== undefined) payload.is_active = updates.is_active;
      if (updates.outreach_count !== undefined) payload.outreach_count = Number(updates.outreach_count);
      if (updates.sort_order !== undefined) payload.sort_order = Number(updates.sort_order);
      if (updates.start_date !== undefined) payload.start_date = updates.start_date;
      if (updates.end_date !== undefined) payload.end_date = updates.end_date;

      const { data, error: updateErr } = await supabase
        .from('recurring_task_templates')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Template update error:', updateErr);
        return { success: false, error: updateErr.message };
      }

      const item = data as any;
      const normalized: RecurringTaskTemplate = {
        ...item,
        priority: priorityFromDb(item.priority),
        day_of_week: Number(item.day_of_week),
        estimated_minutes: Number(item.estimated_minutes || 30),
        is_active: item.is_active ?? true,
      };

      setTemplates((prev) => prev.map((t) => (t.id === id ? normalized : t)));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui template.';
      return { success: false, error: msg };
    }
  };

  const toggleTemplateActive = async (
    id: string,
    currentStatus: boolean
  ): Promise<{ success: boolean; error: string | null }> => {
    return updateTemplate(id, { is_active: !currentStatus });
  };

  const deleteTemplate = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const { error: delErr } = await supabase
        .from('recurring_task_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) {
        console.error('Template delete error:', delErr);
        return { success: false, error: delErr.message };
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus template.';
      return { success: false, error: msg };
    }
  };

  /**
   * Seed default 15 weekly content templates without duplication.
   * Checks matching day_of_week, business_key, and title.
   */
  const seedDefaultTemplates = async (): Promise<{
    success: boolean;
    insertedCount: number;
    error: string | null;
  }> => {
    if (!user) return { success: false, insertedCount: 0, error: 'Pengguna belum terautentikasi.' };

    try {
      // Find which default templates are missing
      const existingKeys = new Set(
        templates.map((t) => `${t.day_of_week}_${t.business_key}_${t.title.trim().toLowerCase()}`)
      );

      const toInsert = DEFAULT_RECURRING_TEMPLATES.filter((def) => {
        const key = `${def.day_of_week}_${def.business_key}_${def.title.trim().toLowerCase()}`;
        return !existingKeys.has(key);
      });

      if (toInsert.length === 0) {
        return {
          success: true,
          insertedCount: 0,
          error: null,
        };
      }

      const payloads = toInsert.map((item, idx) => ({
        user_id: user.id,
        title: item.title,
        description: item.description,
        business_key: item.business_key,
        day_of_week: item.day_of_week,
        task_type: item.task_type,
        priority: priorityToDb(item.priority),
        estimated_minutes: item.estimated_minutes,
        is_active: true,
        outreach_count: item.outreach_count || 0,
        sort_order: templates.length + idx,
      }));

      const { data, error: insertErr } = await supabase
        .from('recurring_task_templates')
        .insert(payloads)
        .select();

      if (insertErr) {
        console.error('Batch insert default templates error:', insertErr);
        return { success: false, insertedCount: 0, error: insertErr.message };
      }

      await fetchTemplates();
      return { success: true, insertedCount: (data || []).length, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat template default.';
      return { success: false, insertedCount: 0, error: msg };
    }
  };

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    toggleTemplateActive,
    deleteTemplate,
    seedDefaultTemplates,
  };
}
