/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FolderPlus,
  FileText,
  Star,
  Pin,
  Archive,
  Network,
  Folder,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Tag,
} from 'lucide-react';
import { Note, NoteCategory, SecondBrainSubView } from '../../types/secondBrain';

interface NoteExplorerProps {
  notes: Note[];
  categories: NoteCategory[];
  selectedNoteId: string | null;
  activeSubView: SecondBrainSubView;
  selectedCategoryId: string | 'all';
  onSelectSubView: (view: SecondBrainSubView) => void;
  onSelectCategory: (catId: string | 'all') => void;
  onSelectNote: (note: Note) => void;
  onCreateNewNote: (categoryId?: string) => void;
  onOpenCategoryManager: () => void;
}

export const NoteExplorer: React.FC<NoteExplorerProps> = ({
  notes,
  categories,
  selectedNoteId,
  activeSubView,
  selectedCategoryId,
  onSelectSubView,
  onSelectCategory,
  onSelectNote,
  onCreateNewNote,
  onOpenCategoryManager,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  // Note counts
  const nonArchivedNotes = useMemo(() => notes.filter((n) => !n.is_archived), [notes]);
  const favoriteCount = useMemo(() => nonArchivedNotes.filter((n) => n.is_favorite).length, [nonArchivedNotes]);
  const pinnedCount = useMemo(() => nonArchivedNotes.filter((n) => n.is_pinned).length, [nonArchivedNotes]);
  const archiveCount = useMemo(() => notes.filter((n) => n.is_archived).length, [notes]);

  // Filter notes based on activeSubView, selectedCategoryId, and search query
  const filteredNotes = useMemo(() => {
    let result = notes;

    // View filter
    if (activeSubView === 'archive') {
      result = result.filter((n) => n.is_archived);
    } else {
      result = result.filter((n) => !n.is_archived);

      if (activeSubView === 'favorites') {
        result = result.filter((n) => n.is_favorite);
      } else if (activeSubView === 'categories' && selectedCategoryId !== 'all') {
        result = result.filter((n) => n.category_id === selectedCategoryId);
      }
    }

    // Category filter in all view
    if (activeSubView === 'all' && selectedCategoryId !== 'all') {
      result = result.filter((n) => n.category_id === selectedCategoryId);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }

    // Sort: pinned first, then updated_at descending
    return [...result].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [notes, activeSubView, selectedCategoryId, searchQuery]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, NoteCategory>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  return (
    <div className="w-72 bg-[#061A32] border border-[#15385F] rounded-2xl flex flex-col h-full shadow-xl overflow-hidden shrink-0">
      {/* 1. Header & Actions */}
      <div className="p-4 border-b border-[#15385F] space-y-3 bg-[#071B35]/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Explorer</span>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCategoryManager}
              className="p-1.5 rounded-lg bg-[#0B2545] hover:bg-[#102D50] text-slate-300 hover:text-cyan-300 border border-[#1E3A5F] transition"
              title="Kelola Kategori"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onCreateNewNote(selectedCategoryId !== 'all' ? selectedCategoryId : undefined)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition"
              title="Buat Catatan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catatan</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul, isi, tag..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0B2545] border border-[#1E3A5F] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>
      </div>

      {/* 2. Sub-Navigations & Quick Views */}
      <div className="px-3 py-2.5 border-b border-[#15385F] space-y-0.5 text-xs">
        <button
          onClick={() => {
            onSelectSubView('all');
            onSelectCategory('all');
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition font-medium ${
            activeSubView === 'all' && selectedCategoryId === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
              : 'text-slate-300 hover:bg-[#0B2545] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Semua Catatan</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{nonArchivedNotes.length}</span>
        </button>

        <button
          onClick={() => onSelectSubView('favorites')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition font-medium ${
            activeSubView === 'favorites'
              ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
              : 'text-slate-300 hover:bg-[#0B2545] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Favorit</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{favoriteCount}</span>
        </button>

        <button
          onClick={() => onSelectSubView('graph')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition font-medium ${
            activeSubView === 'graph'
              ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 font-bold border border-cyan-400/50'
              : 'text-slate-300 hover:bg-[#0B2545] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Knowledge Graph</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
            Peta
          </span>
        </button>

        <button
          onClick={() => onSelectSubView('archive')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition font-medium ${
            activeSubView === 'archive'
              ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
              : 'text-slate-400 hover:bg-[#0B2545] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Archive className="w-3.5 h-3.5 text-purple-400" />
            <span>Arsip</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{archiveCount}</span>
        </button>
      </div>

      {/* 3. Categories Accordion List */}
      <div className="px-3 py-2 border-b border-[#15385F] text-xs">
        <button
          onClick={() => setCategoriesExpanded(!categoriesExpanded)}
          className="w-full flex items-center justify-between px-2 py-1 text-slate-400 hover:text-white font-mono uppercase tracking-wider text-[10px] font-bold"
        >
          <span className="flex items-center gap-1.5">
            {categoriesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>KATEGORI ({categories.length})</span>
          </span>
          <span className="text-cyan-400 text-[9px] lowercase font-sans">kelola</span>
        </button>

        {categoriesExpanded && (
          <div className="mt-1 space-y-0.5 max-h-36 overflow-y-auto">
            {categories.map((cat) => {
              const countInCat = nonArchivedNotes.filter((n) => n.category_id === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectSubView('categories');
                    onSelectCategory(cat.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition text-xs ${
                    isSelected
                      ? 'bg-[#102D50] text-white font-bold border border-[#1E3A5F]'
                      : 'text-slate-300 hover:bg-[#0B2545] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{countInCat}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Notes List View */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        <div className="px-2 pt-1 pb-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>CATATAN ({filteredNotes.length})</span>
          {pinnedCount > 0 && <span>📌 {pinnedCount} disematkan</span>}
        </div>

        {filteredNotes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 space-y-2">
            <FileText className="w-6 h-6 mx-auto text-slate-600" />
            <p>Tidak ada catatan ditemukan</p>
            <button
              onClick={() => onCreateNewNote(selectedCategoryId !== 'all' ? selectedCategoryId : undefined)}
              className="text-cyan-400 hover:underline font-semibold text-xs"
            >
              + Buat Catatan Baru
            </button>
          </div>
        ) : (
          filteredNotes.map((n) => {
            const isSelected = n.id === selectedNoteId;
            const cat = n.category_id ? categoryMap.get(n.category_id) : undefined;
            const snippet = n.content.replace(/[#*`_\[\]]/g, '').trim().slice(0, 75);

            return (
              <button
                key={n.id}
                onClick={() => onSelectNote(n)}
                className={`w-full text-left p-2.5 rounded-xl transition-all border flex flex-col gap-1 group ${
                  isSelected
                    ? 'bg-[#102D50] border-cyan-500/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                    : 'bg-[#0B2545]/60 hover:bg-[#0B2545] border-[#15385F] hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {n.is_pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />}
                    {n.is_favorite && !n.is_pinned && <Star className="w-3 h-3 text-amber-400 shrink-0 fill-amber-400" />}
                    <h5
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-white' : 'text-slate-200 group-hover:text-cyan-300'
                      }`}
                    >
                      {n.title || 'Catatan Tanpa Judul'}
                    </h5>
                  </div>

                  {cat && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                      title={cat.name}
                    />
                  )}
                </div>

                {snippet && (
                  <p className="text-[11px] text-slate-400 line-clamp-1 leading-relaxed">
                    {snippet}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500">
                  <span>
                    {new Date(n.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  {cat && <span className="truncate max-w-[100px]">{cat.name}</span>}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
