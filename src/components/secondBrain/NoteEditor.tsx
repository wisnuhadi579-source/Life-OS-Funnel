/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table as TableIcon,
  Minus,
  Link2,
  Eye,
  Edit3,
  Columns,
  Pin,
  Star,
  Archive,
  Trash2,
  Share2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Network,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Note, NoteCategory } from '../../types/secondBrain';
import { NoteSaveStatus } from '../../hooks/useNotes';
import { NotePreview } from './NotePreview';
import { normalizeNoteTitle } from '../../utils/wikiLinks';

interface NoteEditorProps {
  note: Note;
  categories: NoteCategory[];
  allNotes: Note[];
  saveStatus: NoteSaveStatus;
  saveError: string | null;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onToggleArchive: (id: string, isArchived: boolean) => void;
  onOpenNoteByTitle: (title: string) => void;
  onCreateFromWikiLink: (title: string) => void;
  onOpenLocalGraph: (noteId: string) => void;
}

export type EditorViewMode = 'edit' | 'preview' | 'split';

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  categories,
  allNotes,
  saveStatus,
  saveError,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  onToggleFavorite,
  onToggleArchive,
  onOpenNoteByTitle,
  onCreateFromWikiLink,
  onOpenLocalGraph,
}) => {
  const [viewMode, setViewMode] = useState<EditorViewMode>('split');
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Wiki links autocomplete states
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePos, setAutocompletePos] = useState<{ top: number; left: number } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Periksa apakah judul saat ini menduplikasi catatan lain (case-insensitive)
  const isDuplicateTitle = useMemo(() => {
    const norm = normalizeNoteTitle(title);
    if (!norm) return false;
    return allNotes.some(
      (n) => n.id !== note.id && normalizeNoteTitle(n.title) === norm
    );
  }, [title, allNotes, note.id]);

  // Sync internal state when active note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAutocompleteOpen(false);

    // Jika catatan baru (judul bawaan "Catatan Baru..." dan belum ada konten), sorot judul agar siap diedit
    if (note.title.toLowerCase().startsWith('catatan baru') && !note.content) {
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
          titleInputRef.current.select();
        }
      }, 50);
    }
  }, [note.id]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateNote(note.id, { title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onUpdateNote(note.id, { content: newContent });

    // Check for [[ autocomplete trigger
    const textarea = textareaRef.current;
    if (textarea) {
      const cursor = textarea.selectionStart;
      const textBeforeCursor = newContent.slice(0, cursor);
      const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');

      if (lastDoubleBracket !== -1 && !textBeforeCursor.slice(lastDoubleBracket).includes(']]')) {
        const query = textBeforeCursor.slice(lastDoubleBracket + 2);
        setAutocompleteQuery(query);
        setAutocompleteOpen(true);
        setSelectedIndex(0);
      } else {
        setAutocompleteOpen(false);
      }
    }
  };

  const handleCategoryChange = (catId: string) => {
    const val = catId === 'none' ? null : catId;
    onUpdateNote(note.id, { category_id: val });
  };

  // Helper to insert markdown text around selection
  const insertMarkdown = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selected = currentText.substring(start, end) || defaultText;

    const replacement = `${before}${selected}${after}`;
    const newText = currentText.substring(0, start) + replacement + currentText.substring(end);

    setContent(newText);
    onUpdateNote(note.id, { content: newText });

    // Refocus cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Autocomplete matching notes
  const filteredAutocompleteNotes = allNotes
    .filter((n) => n.id !== note.id && !n.is_archived)
    .filter((n) => n.title.toLowerCase().includes(autocompleteQuery.toLowerCase().trim()))
    .slice(0, 7);

  const applyAutocomplete = (selectedTitle: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBeforeCursor = content.slice(0, cursor);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf('[[');

    if (lastDoubleBracket !== -1) {
      const beforeBracket = content.slice(0, lastDoubleBracket);
      const afterCursor = content.slice(cursor);
      const newText = `${beforeBracket}[[${selectedTitle}]] ${afterCursor}`;

      setContent(newText);
      onUpdateNote(note.id, { content: newText });
      setAutocompleteOpen(false);

      setTimeout(() => {
        textarea.focus();
        const newPos = lastDoubleBracket + selectedTitle.length + 5;
        textarea.setSelectionRange(newPos, newPos);
      }, 10);
    }
  };

  const selectedCategory = categories.find((c) => c.id === note.category_id);

  return (
    <div className="flex-1 flex flex-col bg-[#061A32] border border-[#15385F] rounded-2xl overflow-hidden shadow-xl">
      {/* 1. Header Toolbar: Title, Category, Status, Actions */}
      <div className="px-5 py-3.5 border-b border-[#15385F] bg-[#071B35]/90 flex flex-wrap items-center justify-between gap-3">
        {/* Category selector & status pill */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <select
              value={note.category_id || 'none'}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#0B2545] border border-[#1E3A5F] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-7"
            >
              <option value="none">📁 Tanpa Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  ● {c.name}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedCategory.color }}
              />
            )}
          </div>

          {/* Local Graph Quick Button */}
          <button
            type="button"
            onClick={() => onOpenLocalGraph(note.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B2545] hover:bg-[#102D50] text-cyan-300 border border-[#1E3A5F] hover:border-cyan-500/40 text-xs font-semibold transition"
            title="Lihat peta koneksi langsung catatan ini"
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Local Graph</span>
          </button>

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#0B2545]/70 border border-[#1E3A5F]">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-cyan-300">
                <Clock className="w-3 h-3 animate-spin" />
                <span>Menyimpan...</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Tersimpan</span>
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-rose-400" title={saveError || ''}>
                <AlertCircle className="w-3 h-3" />
                <span>Gagal menyimpan</span>
              </span>
            )}
            {saveStatus === 'idle' && (
              <span className="text-slate-400">
                Terakhir: {new Date(note.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* View mode toggle & Note actions */}
        <div className="flex items-center gap-2">
          {/* View mode pills */}
          <div className="flex items-center bg-[#0B2545] p-1 rounded-xl border border-[#1E3A5F]">
            <button
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'edit'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Tulis"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'split'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Split View (Tulis & Preview)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'preview'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#1E3A5F] mx-0.5" />

          {/* Pin */}
          <button
            onClick={() => onTogglePin(note.id, note.is_pinned)}
            className={`p-2 rounded-xl border transition ${
              note.is_pinned
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-[#0B2545] text-slate-400 hover:text-white border-[#1E3A5F]'
            }`}
            title={note.is_pinned ? 'Lepas Sematan' : 'Sematkan di Atas'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite(note.id, note.is_favorite)}
            className={`p-2 rounded-xl border transition ${
              note.is_favorite
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 fill-amber-300'
                : 'bg-[#0B2545] text-slate-400 hover:text-white border-[#1E3A5F]'
            }`}
            title={note.is_favorite ? 'Hapus dari Favorit' : 'Tandai Favorit'}
          >
            <Star className={`w-3.5 h-3.5 ${note.is_favorite ? 'fill-current' : ''}`} />
          </button>

          {/* Archive */}
          <button
            onClick={() => onToggleArchive(note.id, note.is_archived)}
            className={`p-2 rounded-xl border transition ${
              note.is_archived
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-[#0B2545] text-slate-400 hover:text-white border-[#1E3A5F]'
            }`}
            title={note.is_archived ? 'Pulihkan dari Arsip' : 'Arsipkan Catatan'}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-xl bg-[#0B2545] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-[#1E3A5F] hover:border-rose-500/40 transition"
            title="Hapus Catatan"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Note Title Input */}
      <div className="px-6 pt-4 pb-2 border-b border-[#15385F]/60">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Judul Catatan..."
          className="w-full bg-transparent text-xl sm:text-2xl font-black text-white focus:outline-none tracking-tight placeholder-slate-600 font-sans"
        />
        {isDuplicateTitle && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400 mt-1.5 font-medium animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Judul ini sudah digunakan oleh catatan lain. Gunakan judul yang unik agar tautan [[Wiki Links]] tepat sasaran.
            </span>
          </div>
        )}
      </div>

      {/* 3. Markdown Formatting Toolbar */}
      {viewMode !== 'preview' && (
        <div className="px-5 py-2 border-b border-[#15385F] bg-[#071B35]/70 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {/* Headings */}
          <button
            onClick={() => insertMarkdown('# ', '', 'Judul H1')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('## ', '', 'Judul H2')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('### ', '', 'Judul H3')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#1E3A5F] mx-1" />

          {/* Formatting */}
          <button
            onClick={() => insertMarkdown('**', '**', 'teks tebal')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('*', '*', 'teks miring')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('~~', '~~', 'teks coret')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#1E3A5F] mx-1" />

          {/* Lists */}
          <button
            onClick={() => insertMarkdown('- ', '', 'Item')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('1. ', '', 'Item')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('- [ ] ', '', 'Tugas')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Checklist"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#1E3A5F] mx-1" />

          {/* Blockquote & Code */}
          <button
            onClick={() => insertMarkdown('> ', '', 'Kutipan inspiratif')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('`', '`', 'kode')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('```\n', '\n```', 'kode blok')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition font-mono text-xs"
            title="Code Block"
          >
            {'{}'}
          </button>

          <div className="h-3.5 w-px bg-[#1E3A5F] mx-1" />

          {/* Table & Divider */}
          <button
            onClick={() =>
              insertMarkdown(
                '\n| Kolom 1 | Kolom 2 |\n|---|---|\n| Data 1 | Data 2 |\n'
              )
            }
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Tabel Markdown"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertMarkdown('\n---\n')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#102D50] transition"
            title="Garis Pembatas (Divider)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#1E3A5F] mx-1" />

          {/* WIKI LINK BUTTON */}
          <button
            onClick={() => insertMarkdown('[[', ']]', 'Judul Catatan')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm"
            title="Sisipkan Wiki Link [[Judul Catatan]]"
          >
            <Link2 className="w-3 h-3 text-cyan-400" />
            <span>[[Wiki Link]]</span>
          </button>
        </div>
      )}

      {/* 4. Editor / Preview Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor Area */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`flex-1 flex flex-col p-6 overflow-y-auto ${
              viewMode === 'split' ? 'border-r border-[#15385F]' : ''
            }`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Mulai menulis catatan Anda di sini... Gunakan Markdown dan [[Wiki Links]] untuk menghubungkan pemikiran."
              className="w-full flex-1 min-h-[400px] bg-transparent text-slate-200 text-sm font-sans leading-relaxed focus:outline-none resize-none placeholder-slate-600 whitespace-pre-wrap break-words"
              style={{ overflowWrap: 'anywhere' }}
            />
          </div>
        )}

        {/* Autocomplete Dropdown for [[ */}
        {autocompleteOpen && (
          <div className="absolute z-30 left-6 top-16 w-72 bg-[#0B2545] border border-cyan-500/50 rounded-xl shadow-2xl p-2 space-y-1 backdrop-blur-md">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-[#1E3A5F] flex items-center justify-between">
              <span>Hubungkan Catatan [[...]]</span>
              <span>{filteredAutocompleteNotes.length} hasil</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredAutocompleteNotes.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 italic">
                  Belum ada catatan dengan judul "{autocompleteQuery}". Lanjutkan mengetik untuk membuat tautan baru.
                </div>
              ) : (
                filteredAutocompleteNotes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => applyAutocomplete(n.title)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#15385F] text-slate-200 hover:text-white flex items-center justify-between transition group"
                  >
                    <span className="font-semibold truncate">{n.title}</span>
                    <Link2 className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Preview Area */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#071B35]/40">
            <NotePreview
              content={content}
              allNotes={allNotes}
              onOpenNoteByTitle={onOpenNoteByTitle}
              onCreateFromWikiLink={onCreateFromWikiLink}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#102D50] border border-rose-500/40 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Hapus Catatan?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Catatan <strong className="text-white">"{note.title}"</strong> akan dihapus permanen. Tautan Wiki Link di catatan lain yang menunjuk ke sini akan menjadi tak bertuan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-[#0B2545] hover:bg-[#15385F] border border-[#1E3A5F] rounded-xl text-xs font-semibold text-slate-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDeleteNote(note.id);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
