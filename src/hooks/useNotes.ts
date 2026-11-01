/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Note } from '../types/secondBrain';
import { normalizeNoteTitle } from '../utils/wikiLinks';
import { useNoteLinks } from './useNoteLinks';

export type NoteSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { syncNoteLinks } = useNoteLinks();

  // Autosave debounce timer and pending updates refs to prevent stale closure
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<{ id: string; updates: Partial<Note> } | null>(null);
  const notesRef = useRef<Note[]>([]);
  notesRef.current = notes;

  const fetchNotes = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (fetchErr) {
        console.error('Error fetching notes:', fetchErr);
        setError(fetchErr.message);
        return [];
      }

      const list = (data || []) as Note[];
      setNotes(list);
      return list;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat catatan.';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Selected note derived from selectedNoteId
  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  /**
   * Flush any pending autosave synchronously to Supabase before switching notes
   */
  const flushPendingAutosave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!pendingUpdatesRef.current || !user) return;

    const { id, updates } = pendingUpdatesRef.current;
    pendingUpdatesRef.current = null;

    try {
      const dbPayload = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      await supabase
        .from('notes')
        .update(dbPayload)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updates.content !== undefined) {
        syncNoteLinks(id, updates.content);
      }
    } catch (err) {
      console.warn('Failed to flush pending autosave:', err);
    }
  }, [user, syncNoteLinks]);

  /**
   * Pilih catatan dengan aman (flush perubahan catatan sebelumnya terlebih dahulu)
   */
  const selectNote = useCallback(
    async (noteOrId: Note | string | null) => {
      await flushPendingAutosave();
      if (!noteOrId) {
        setSelectedNoteId(null);
      } else if (typeof noteOrId === 'string') {
        setSelectedNoteId(noteOrId);
      } else {
        setSelectedNoteId(noteOrId.id);
      }
      setSaveStatus('idle');
    },
    [flushPendingAutosave]
  );

  /**
   * Simpan catatan langsung ke Supabase
   */
  const saveNoteImmediate = useCallback(
    async (
      id: string,
      updates: Partial<Note>
    ): Promise<{ success: boolean; error: string | null }> => {
      if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

      setSaveStatus('saving');
      setSaveError(null);

      try {
        const nowIso = new Date().toISOString();
        const payload: Record<string, any> = {
          updated_at: nowIso,
        };

        if (updates.title !== undefined) payload.title = updates.title.trim();
        if (updates.content !== undefined) payload.content = updates.content;
        if (updates.category_id !== undefined) payload.category_id = updates.category_id;
        if (updates.is_pinned !== undefined) payload.is_pinned = updates.is_pinned;
        if (updates.is_favorite !== undefined) payload.is_favorite = updates.is_favorite;
        if (updates.is_archived !== undefined) payload.is_archived = updates.is_archived;

        const { data, error: updateErr } = await supabase
          .from('notes')
          .update(payload)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateErr) {
          setSaveStatus('error');
          setSaveError(updateErr.message);
          return { success: false, error: updateErr.message };
        }

        const updated = data as Note;
        setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
        setSaveStatus('saved');

        // Sinkronisasi Wiki Links jika konten berubah
        if (updates.content !== undefined) {
          syncNoteLinks(id, updates.content);
        }

        return { success: true, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menyimpan catatan.';
        setSaveStatus('error');
        setSaveError(msg);
        return { success: false, error: msg };
      }
    },
    [user, syncNoteLinks]
  );

  /**
   * Autosave dengan debounce 700ms.
   * Mengupdate state lokal secara optimistik seketika untuk responsivitas editor,
   * lalu mengirim payload ke database setelah penundaan.
   */
  const queueAutosave = useCallback(
    (id: string, updates: Partial<Note>) => {
      // Optimistic local update
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: new Date().toISOString() } : n))
      );

      // Track pending update
      pendingUpdatesRef.current = {
        id,
        updates: {
          ...(pendingUpdatesRef.current?.id === id ? pendingUpdatesRef.current.updates : {}),
          ...updates,
        },
      };

      setSaveStatus('saving');

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(async () => {
        if (!pendingUpdatesRef.current || pendingUpdatesRef.current.id !== id) return;
        const currentUpdates = pendingUpdatesRef.current.updates;
        pendingUpdatesRef.current = null;
        await saveNoteImmediate(id, currentUpdates);
      }, 700);
    },
    [saveNoteImmediate]
  );

  /**
   * Buat catatan baru
   */
  const createNote = useCallback(
    async (
      initialData?: Partial<Pick<Note, 'title' | 'content' | 'category_id'>>
    ): Promise<{ success: boolean; data?: Note; error: string | null }> => {
      if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

      await flushPendingAutosave();

      try {
        const payload = {
          user_id: user.id,
          title: (initialData?.title || 'Catatan Baru').trim(),
          content: initialData?.content || '',
          category_id: initialData?.category_id || null,
          is_pinned: false,
          is_favorite: false,
          is_archived: false,
        };

        const { data, error: insertErr } = await supabase
          .from('notes')
          .insert([payload])
          .select()
          .single();

        if (insertErr) {
          return { success: false, error: insertErr.message };
        }

        const created = data as Note;
        setNotes((prev) => [created, ...prev]);
        setSelectedNoteId(created.id);
        setSaveStatus('saved');

        // Sinkronisasi wiki links jika ada teks awal
        if (created.content) {
          syncNoteLinks(created.id, created.content);
        }

        return { success: true, data: created, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal membuat catatan baru.';
        return { success: false, error: msg };
      }
    },
    [user, flushPendingAutosave, syncNoteLinks]
  );

  /**
   * Hapus catatan
   */
  const deleteNote = useCallback(
    async (id: string): Promise<{ success: boolean; error: string | null }> => {
      if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

      if (pendingUpdatesRef.current?.id === id) {
        pendingUpdatesRef.current = null;
      }
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      try {
        const { error: delErr } = await supabase
          .from('notes')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (delErr) {
          return { success: false, error: delErr.message };
        }

        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (selectedNoteId === id) {
          setSelectedNoteId(null);
        }

        return { success: true, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menghapus catatan.';
        return { success: false, error: msg };
      }
    },
    [user, selectedNoteId]
  );

  /**
   * Toggle Pin status
   */
  const togglePin = useCallback(
    async (id: string, currentPin: boolean) => {
      return saveNoteImmediate(id, { is_pinned: !currentPin });
    },
    [saveNoteImmediate]
  );

  /**
   * Toggle Favorite status
   */
  const toggleFavorite = useCallback(
    async (id: string, currentFav: boolean) => {
      return saveNoteImmediate(id, { is_favorite: !currentFav });
    },
    [saveNoteImmediate]
  );

  /**
   * Toggle Archive status
   */
  const toggleArchive = useCallback(
    async (id: string, currentArchived: boolean) => {
      return saveNoteImmediate(id, { is_archived: !currentArchived });
    },
    [saveNoteImmediate]
  );

  /**
   * Cari catatan berdasarkan judul secara case-insensitive
   */
  const findNoteByTitle = useCallback(
    (targetTitle: string): Note | undefined => {
      const cleanKey = normalizeNoteTitle(targetTitle);
      return notes.find((n) => normalizeNoteTitle(n.title) === cleanKey);
    },
    [notes]
  );

  /**
   * Buat catatan baru otomatis dari Wiki Link yang belum ada
   */
  const createNoteFromWikiLink = useCallback(
    async (rawTitle: string): Promise<Note | null> => {
      const title = rawTitle.trim();
      if (!title) return null;

      // Cek apakah sudah ada untuk menghindari duplikasi
      const existing = findNoteByTitle(title);
      if (existing) {
        await selectNote(existing);
        return existing;
      }

      const res = await createNote({
        title,
        content: `# ${title}\n\n*Catatan ini dibuat dari tautan Wiki Link [[${title}]]. Tuliskan catatan atau referensi Anda di sini.*`,
      });

      return res.data || null;
    },
    [findNoteByTitle, createNote, selectNote]
  );

  return {
    notes,
    selectedNote,
    selectedNoteId,
    loading,
    error,
    saveStatus,
    saveError,
    fetchNotes,
    selectNote,
    createNote,
    saveNoteImmediate,
    queueAutosave,
    deleteNote,
    togglePin,
    toggleFavorite,
    toggleArchive,
    findNoteByTitle,
    createNoteFromWikiLink,
    flushPendingAutosave,
  };
}
