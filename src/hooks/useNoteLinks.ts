/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { extractWikiLinks } from '../utils/wikiLinks';
import { BacklinkItem, OutgoingLinkItem, NoteLink } from '../types/secondBrain';

export function useNoteLinks() {
  const { user } = useAuth();
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [outgoingLinks, setOutgoingLinks] = useState<OutgoingLinkItem[]>([]);
  const [allLinks, setAllLinks] = useState<NoteLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  /**
   * Panggil RPC life_os_sync_note_links setelah INSERT atau UPDATE catatan.
   * Ekstrak Wiki Links dari teks dan kirim payload ke Supabase.
   */
  const syncNoteLinks = useCallback(
    async (
      noteId: string,
      content: string
    ): Promise<{ success: boolean; linkCount: number; error: string | null }> => {
      if (!user || !isSupabaseConfigured() || !noteId) {
        return { success: false, linkCount: 0, error: 'User tidak terautentikasi atau noteId kosong' };
      }

      try {
        const extracted = extractWikiLinks(content);
        const payload = extracted.map((l) => ({ target_title: l.target_title }));

        const { data, error: rpcErr } = await supabase.rpc('life_os_sync_note_links', {
          p_source_note_id: noteId,
          p_links: payload,
        });

        if (rpcErr) {
          console.warn('RPC life_os_sync_note_links notice:', rpcErr);
          return { success: false, linkCount: extracted.length, error: rpcErr.message };
        }

        return { success: true, linkCount: extracted.length, error: null };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi link';
        return { success: false, linkCount: 0, error: msg };
      }
    },
    [user]
  );

  /**
   * Ambil semua catatan yang menunjuk (link) ke targetNoteId
   */
  const fetchBacklinksForNote = useCallback(
    async (targetNoteId: string): Promise<BacklinkItem[]> => {
      if (!user || !isSupabaseConfigured() || !targetNoteId) {
        setBacklinks([]);
        return [];
      }

      try {
        setLoadingLinks(true);
        // Query note_links where target_note_id = targetNoteId
        const { data: linkRows, error: linkErr } = await supabase
          .from('note_links')
          .select('id, source_note_id, created_at')
          .eq('user_id', user.id)
          .eq('target_note_id', targetNoteId);

        if (linkErr) {
          console.error('Error fetching backlinks:', linkErr);
          setBacklinks([]);
          return [];
        }

        if (!linkRows || linkRows.length === 0) {
          setBacklinks([]);
          return [];
        }

        // Ambil info catatan sumber
        const sourceIds = Array.from(new Set(linkRows.map((r: any) => r.source_note_id)));
        const { data: noteRows } = await supabase
          .from('notes')
          .select('id, title, category_id')
          .in('id', sourceIds);

        const notesMap = new Map((noteRows || []).map((n: any) => [n.id, n]));

        const results: BacklinkItem[] = linkRows.map((r: any) => {
          const source = notesMap.get(r.source_note_id);
          return {
            id: r.id,
            source_note_id: r.source_note_id,
            source_title: source?.title || 'Catatan Tanpa Judul',
            source_category_id: source?.category_id || null,
            created_at: r.created_at,
          };
        });

        setBacklinks(results);
        return results;
      } catch (err: unknown) {
        console.error('Backlinks error:', err);
        setBacklinks([]);
        return [];
      } finally {
        setLoadingLinks(false);
      }
    },
    [user]
  );

  /**
   * Ambil outgoing links yang ditunjuk dari sourceNoteId
   */
  const fetchOutgoingLinksForNote = useCallback(
    async (sourceNoteId: string, currentContent?: string): Promise<OutgoingLinkItem[]> => {
      if (!user || !isSupabaseConfigured() || !sourceNoteId) {
        setOutgoingLinks([]);
        return [];
      }

      try {
        // Cek link tersimpan di DB
        const { data: linkRows } = await supabase
          .from('note_links')
          .select('target_title, target_note_id')
          .eq('user_id', user.id)
          .eq('source_note_id', sourceNoteId);

        // Jika teks sedang diedit, padukan dengan extractedWikiLinks
        const extracted = currentContent !== undefined ? extractWikiLinks(currentContent) : [];
        const dbMap = new Map((linkRows || []).map((r: any) => [r.target_title.toLowerCase().trim(), r.target_note_id]));

        const titles = currentContent !== undefined
          ? extracted.map((e) => e.target_title)
          : (linkRows || []).map((r: any) => r.target_title);

        const uniqueTitles = Array.from(new Set(titles));

        // Cari tahu apakah target_note_id ada di database notes
        let resolvedMap = new Map<string, string>();
        if (uniqueTitles.length > 0) {
          const { data: targetNotes } = await supabase
            .from('notes')
            .select('id, title')
            .eq('user_id', user.id);

          (targetNotes || []).forEach((n: any) => {
            resolvedMap.set(n.title.toLowerCase().trim(), n.id);
          });
        }

        const results: OutgoingLinkItem[] = uniqueTitles.map((t) => {
          const key = t.toLowerCase().trim();
          const targetId = resolvedMap.get(key) || dbMap.get(key) || null;
          return {
            target_title: t,
            target_note_id: targetId,
            is_resolved: Boolean(targetId),
          };
        });

        setOutgoingLinks(results);
        return results;
      } catch (err: unknown) {
        console.error('Outgoing links error:', err);
        setOutgoingLinks([]);
        return [];
      }
    },
    [user]
  );

  /**
   * Ambil semua note_links untuk konstruksi graph
   */
  const fetchAllLinks = useCallback(async (): Promise<NoteLink[]> => {
    if (!user || !isSupabaseConfigured()) {
      setAllLinks([]);
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('note_links')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching all note_links:', error);
        return [];
      }

      const list = (data || []) as NoteLink[];
      setAllLinks(list);
      return list;
    } catch (err) {
      console.error('Error in fetchAllLinks:', err);
      return [];
    }
  }, [user]);

  return {
    backlinks,
    outgoingLinks,
    allLinks,
    loadingLinks,
    linkError,
    syncNoteLinks,
    fetchBacklinksForNote,
    fetchOutgoingLinksForNote,
    fetchAllLinks,
  };
}
