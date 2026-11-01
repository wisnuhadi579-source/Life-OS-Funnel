/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Link2,
  FileText,
  Clock,
  Calendar,
  Network,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Folder,
} from 'lucide-react';
import { Note, NoteCategory, BacklinkItem, OutgoingLinkItem } from '../../types/secondBrain';
import { useNoteLinks } from '../../hooks/useNoteLinks';

interface KnowledgePanelProps {
  note: Note;
  categories: NoteCategory[];
  onOpenNoteById: (id: string) => void;
  onOpenNoteByTitle: (title: string) => void;
  onCreateFromWikiLink: (title: string) => void;
  onOpenLocalGraph: (noteId: string) => void;
}

export const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  note,
  categories,
  onOpenNoteById,
  onOpenNoteByTitle,
  onCreateFromWikiLink,
  onOpenLocalGraph,
}) => {
  const { backlinks, outgoingLinks, loadingLinks, fetchBacklinksForNote, fetchOutgoingLinksForNote } =
    useNoteLinks();

  // Load backlinks and outgoing links whenever the note changes
  useEffect(() => {
    fetchBacklinksForNote(note.id);
    fetchOutgoingLinksForNote(note.id, note.content);
  }, [note.id, note.content, fetchBacklinksForNote, fetchOutgoingLinksForNote]);

  const selectedCategory = categories.find((c) => c.id === note.category_id);

  // Compute word count and reading time
  const cleanText = note.content.replace(/[#*`_\[\]]/g, '').trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = note.content.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="w-80 bg-[#061A32] border border-[#15385F] rounded-2xl p-5 flex flex-col space-y-6 overflow-y-auto text-white shadow-xl max-h-full">
      {/* Panel Header */}
      <div className="pb-3 border-b border-[#15385F] flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
          <Network className="w-4 h-4" />
          <span>Knowledge Hub</span>
        </div>
        <button
          onClick={() => onOpenLocalGraph(note.id)}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-semibold flex items-center gap-1"
        >
          <span>Local Graph</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 1. Note Properties */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Properti Catatan
        </h4>
        <div className="bg-[#0B2545]/70 border border-[#1E3A5F] rounded-xl p-3.5 space-y-2 text-xs">
          {/* Category */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kategori</span>
            </span>
            {selectedCategory ? (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md border text-white font-mono"
                style={{
                  backgroundColor: `${selectedCategory.color}20`,
                  borderColor: `${selectedCategory.color}60`,
                  color: selectedCategory.color,
                }}
              >
                ● {selectedCategory.name}
              </span>
            ) : (
              <span className="text-slate-500 italic text-[11px]">Tanpa Kategori</span>
            )}
          </div>

          {/* Stats: Words & Reading Time */}
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Panjang Teks</span>
            </span>
            <span className="font-mono text-[11px] text-slate-200">
              {wordCount} kata ({charCount} kar)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Waktu Baca</span>
            </span>
            <span className="font-mono text-[11px] text-slate-200">~{readingTime} menit</span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-[#1E3A5F]/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dibuat</span>
            </span>
            <span className="font-mono text-[10px] text-slate-300">
              {new Date(note.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Backlinks (Catatan yang Menghubungkan ke Sini) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backlinks ({backlinks.length})</span>
          </h4>
          <span className="text-[10px] text-cyan-400 font-mono">Incoming</span>
        </div>

        {loadingLinks ? (
          <div className="p-4 text-center text-xs text-slate-400 italic">Memuat tautan...</div>
        ) : backlinks.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#0B2545]/40 border border-[#1E3A5F] text-center text-xs text-slate-400 leading-relaxed">
            Belum ada catatan yang menghubungkan ke sini.
            <p className="text-[10px] text-slate-500 mt-1">
              Gunakan <span className="font-mono text-cyan-300">[[{note.title}]]</span> di catatan lain untuk menghubungkannya.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => onOpenNoteById(bl.source_note_id)}
                className="w-full text-left p-2.5 rounded-xl bg-[#0B2545]/70 hover:bg-[#102D50] border border-[#1E3A5F] hover:border-cyan-500/40 transition group flex items-center justify-between text-xs"
              >
                <div className="overflow-hidden">
                  <span className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate block">
                    {bl.source_title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(bl.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Outgoing Wiki Links (Tautan Keluar) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tautan Keluar ({outgoingLinks.length})</span>
          </h4>
          <span className="text-[10px] text-cyan-400 font-mono">Outgoing</span>
        </div>

        {outgoingLinks.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#0B2545]/40 border border-[#1E3A5F] text-center text-xs text-slate-400 leading-relaxed">
            Belum ada tautan [[Wiki Link]] di catatan ini.
          </div>
        ) : (
          <div className="space-y-1.5">
            {outgoingLinks.map((out, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#0B2545]/70 border border-[#1E3A5F] flex items-center justify-between gap-2 text-xs"
              >
                <div className="overflow-hidden flex-1">
                  <span
                    className={`font-semibold truncate block ${
                      out.is_resolved ? 'text-cyan-300' : 'text-amber-300'
                    }`}
                  >
                    [[{out.target_title}]]
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {out.is_resolved ? '✓ Catatan tersedia' : '⚠ Belum dibuat'}
                  </span>
                </div>

                {out.is_resolved ? (
                  <button
                    onClick={() => onOpenNoteByTitle(out.target_title)}
                    className="p-1.5 rounded-lg bg-[#071B35] hover:bg-[#15385F] text-cyan-400 transition"
                    title="Buka Catatan"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onCreateFromWikiLink(out.target_title)}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 transition"
                    title="Buat Catatan Sekarang"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Buat</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
