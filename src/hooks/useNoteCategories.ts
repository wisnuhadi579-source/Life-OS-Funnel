/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { NoteCategory } from '../types/secondBrain';

export const DEFAULT_NOTE_CATEGORIES = [
  {
    name: 'Ide & Inspirasi',
    description: 'Percikan ide, konsep segar, dan pemikiran spontan',
    color: '#F59E0B', // Amber
    icon: 'lightbulb',
    sort_order: 1,
  },
  {
    name: 'Bisnis',
    description: 'Strategi, penawaran, funneling, dan rencana komersial',
    color: '#0EA5E9', // Cyan
    icon: 'briefcase',
    sort_order: 2,
  },
  {
    name: 'Pembelajaran',
    description: 'Ringkasan buku, kursus, insight webinar, dan keahlian baru',
    color: '#8B5CF6', // Violet
    icon: 'book-open',
    sort_order: 3,
  },
  {
    name: 'Referensi',
    description: 'Kutipan, data riset, framework, dan arsip informasi penting',
    color: '#10B981', // Emerald
    icon: 'bookmark',
    sort_order: 4,
  },
  {
    name: 'Proyek',
    description: 'Rencana aksi, peluncuran produk, dan milestone spesifik',
    color: '#F43F5E', // Rose
    icon: 'folder',
    sort_order: 5,
  },
  {
    name: 'Personal',
    description: 'Refleksi diri, jurnal mingguan, dan pengembangan pribadi',
    color: '#6366F1', // Indigo
    icon: 'user',
    sort_order: 6,
  },
];

export interface CreateNoteCategoryInput {
  name: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  sort_order?: number;
}

export function useNoteCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seedingRef = useRef(false);

  const fetchCategories = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('note_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (fetchErr) {
        console.error('Error fetching note_categories:', fetchErr);
        setError(fetchErr.message);
        return [];
      }

      const list = (data || []) as NoteCategory[];
      setCategories(list);
      return list;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat kategori catatan.';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Seed default categories if none exist for user
  const seedDefaultCategories = useCallback(async () => {
    if (!user || seedingRef.current || !isSupabaseConfigured()) return;
    seedingRef.current = true;

    try {
      const currentList = await fetchCategories();
      if (currentList.length === 0) {
        const payload = DEFAULT_NOTE_CATEGORIES.map((cat) => ({
          user_id: user.id,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          sort_order: cat.sort_order,
        }));

        // Cek kategori yang sudah ada di database sebelum insert agar aman dari constraint unik
        const { data: existingRows } = await supabase
          .from('note_categories')
          .select('name')
          .eq('user_id', user.id);

        const existingNames = new Set((existingRows || []).map((r: any) => r.name.toLowerCase().trim()));
        const toInsert = payload.filter((c) => !existingNames.has(c.name.toLowerCase().trim()));

        if (toInsert.length > 0) {
          const { error: seedErr } = await supabase
            .from('note_categories')
            .insert(toInsert);

          if (seedErr) {
            console.warn('Seed note_categories notice (continuing):', seedErr.message);
          }
        }
        await fetchCategories();
      }
    } catch (err) {
      console.warn('Error during default categories seeding:', err);
      await fetchCategories();
    } finally {
      seedingRef.current = false;
    }
  }, [user, fetchCategories]);

  useEffect(() => {
    seedDefaultCategories();
  }, [seedDefaultCategories]);

  const createCategory = async (
    cat: CreateNoteCategoryInput
  ): Promise<{ success: boolean; data?: NoteCategory; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const payload = {
        user_id: user.id,
        name: cat.name.trim(),
        description: cat.description || null,
        color: cat.color || '#0EA5E9',
        icon: cat.icon || 'folder',
        sort_order: cat.sort_order ?? categories.length + 1,
      };

      const { data, error: insertErr } = await supabase
        .from('note_categories')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }

      const created = data as NoteCategory;
      setCategories((prev) => [...prev, created]);
      return { success: true, data: created, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat kategori.';
      return { success: false, error: msg };
    }
  };

  const updateCategory = async (
    id: string,
    updates: Partial<NoteCategory>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      const payload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.sort_order !== undefined) payload.sort_order = updates.sort_order;

      const { data, error: updateErr } = await supabase
        .from('note_categories')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      const updated = data as NoteCategory;
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui kategori.';
      return { success: false, error: msg };
    }
  };

  const deleteCategory = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      // Step 1: Set category_id to null for any notes using this category (ensure notes are never deleted)
      await supabase
        .from('notes')
        .update({ category_id: null, updated_at: new Date().toISOString() })
        .eq('category_id', id)
        .eq('user_id', user.id);

      // Step 2: Delete category
      const { error: delErr } = await supabase
        .from('note_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) {
        return { success: false, error: delErr.message };
      }

      setCategories((prev) => prev.filter((c) => c.id !== id));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kategori.';
      return { success: false, error: msg };
    }
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
