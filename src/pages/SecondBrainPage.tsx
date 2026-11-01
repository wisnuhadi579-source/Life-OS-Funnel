/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Plus,
  Network,
  PanelRightClose,
  PanelRightOpen,
  FolderPlus,
  Sparkles,
  Link2,
  FileText,
  Search,
  BookOpen,
  Layers,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useNoteCategories } from '../hooks/useNoteCategories';
import { useNoteLinks } from '../hooks/useNoteLinks';
import { Note, SecondBrainSubView } from '../types/secondBrain';
import { NoteExplorer } from '../components/secondBrain/NoteExplorer';
import { NoteEditor } from '../components/secondBrain/NoteEditor';
import { KnowledgePanel } from '../components/secondBrain/KnowledgePanel';
import { KnowledgeGraphView } from '../components/secondBrain/KnowledgeGraphView';
import { CategoryManagerModal } from '../components/secondBrain/CategoryManagerModal';

export const SecondBrainPage: React.FC = () => {
  const {
    notes,
    selectedNote,
    selectedNoteId,
    loading: loadingNotes,
    saveStatus,
    saveError,
    fetchNotes,
    selectNote,
    createNote,
    queueAutosave,
    deleteNote,
    togglePin,
    toggleFavorite,
    toggleArchive,
    findNoteByTitle,
    createNoteFromWikiLink,
  } = useNotes();

  const {
    categories,
    loading: loadingCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useNoteCategories();

  const { allLinks, fetchAllLinks } = useNoteLinks();

  // Sub-navigation view: 'all' | 'categories' | 'favorites' | 'graph' | 'archive'
  const [activeSubView, setActiveSubView] = useState<SecondBrainSubView>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all');

  // UI Panels State
  const [knowledgePanelOpen, setKnowledgePanelOpen] = useState(true);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [localGraphNoteId, setLocalGraphNoteId] = useState<string | null>(null);

  // Mobile Drawer states
  const [mobileExplorerOpen, setMobileExplorerOpen] = useState(false);
  const [mobileKnowledgeOpen, setMobileKnowledgeOpen] = useState(false);

  // Fetch all links when entering graph view or when notes change
  useEffect(() => {
    fetchAllLinks();
  }, [notes, fetchAllLinks]);

  // Open note by title (from Wiki Links)
  const handleOpenNoteByTitle = async (title: string) => {
    const existing = findNoteByTitle(title);
    if (existing) {
      await selectNote(existing);
      setActiveSubView('all');
      setLocalGraphNoteId(null);
    } else {
      // Auto create and open
      const created = await createNoteFromWikiLink(title);
      if (created) {
        setActiveSubView('all');
        setLocalGraphNoteId(null);
      }
    }
  };

  const handleOpenLocalGraph = (noteId: string) => {
    setLocalGraphNoteId(noteId);
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col space-y-3 pb-2 overflow-hidden">
      {/* Top Action & Subnav Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-1 border-b border-[#15385F]">
        <div className="flex items-center gap-2.5">
          {/* Mobile explorer toggle */}
          <button
            onClick={() => setMobileExplorerOpen(!mobileExplorerOpen)}
            className="md:hidden p-2 rounded-xl bg-[#0B2545] border border-[#1E3A5F] text-slate-300 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0EA5E9] via-[#0284C7] to-[#22D3EE] flex items-center justify-center text-white shadow-md shadow-[#0EA5E9]/20 border border-white/20">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Second Brain</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                PKM
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Pusat pengetahuan pribadi terhubung berbasis Markdown, [[Wiki Links]], dan Knowledge Graph.
            </p>
          </div>
        </div>

        {/* Subnavigation Pills & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subnav Pills */}
          <div className="hidden lg:flex items-center bg-[#061A32] p-1 rounded-xl border border-[#15385F] text-xs">
            <button
              onClick={() => {
                setActiveSubView('all');
                setSelectedCategoryId('all');
                setLocalGraphNoteId(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeSubView === 'all' && !localGraphNoteId
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Catatan
            </button>
            <button
              onClick={() => {
                setActiveSubView('categories');
                setLocalGraphNoteId(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeSubView === 'categories' && !localGraphNoteId
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kategori
            </button>
            <button
              onClick={() => {
                setActiveSubView('favorites');
                setLocalGraphNoteId(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeSubView === 'favorites' && !localGraphNoteId
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Favorit
            </button>
            <button
              onClick={() => {
                setActiveSubView('graph');
                setLocalGraphNoteId(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeSubView === 'graph' && !localGraphNoteId
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-cyan-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Knowledge Graph</span>
            </button>
            <button
              onClick={() => {
                setActiveSubView('archive');
                setLocalGraphNoteId(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeSubView === 'archive' && !localGraphNoteId
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Arsip
            </button>
          </div>

          {/* New Note Button */}
          <button
            onClick={() => createNote()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catatan Baru</span>
          </button>

          {/* Knowledge Panel Toggle (Desktop) */}
          {selectedNote && activeSubView !== 'graph' && !localGraphNoteId && (
            <button
              onClick={() => setKnowledgePanelOpen(!knowledgePanelOpen)}
              className="hidden lg:flex p-2 rounded-xl bg-[#0B2545] hover:bg-[#15385F] text-slate-300 hover:text-cyan-300 border border-[#1E3A5F] transition"
              title={knowledgePanelOpen ? 'Tutup Knowledge Hub' : 'Buka Knowledge Hub'}
            >
              {knowledgePanelOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Panel Workspace Container */}
      <div className="flex-1 flex gap-3 overflow-hidden relative">
        {/* PANEL KIRI: NOTE EXPLORER (Desktop) */}
        <div className="hidden md:flex h-full">
          <NoteExplorer
            notes={notes}
            categories={categories}
            selectedNoteId={selectedNoteId}
            activeSubView={activeSubView}
            selectedCategoryId={selectedCategoryId}
            onSelectSubView={(v) => {
              setActiveSubView(v);
              setLocalGraphNoteId(null);
            }}
            onSelectCategory={(c) => {
              setSelectedCategoryId(c);
              setLocalGraphNoteId(null);
            }}
            onSelectNote={(n) => {
              selectNote(n);
              setLocalGraphNoteId(null);
              if (activeSubView === 'graph') {
                setActiveSubView('all');
              }
            }}
            onCreateNewNote={(catId) => {
              createNote({ category_id: catId });
              setLocalGraphNoteId(null);
              if (activeSubView === 'graph') setActiveSubView('all');
            }}
            onOpenCategoryManager={() => setCategoryModalOpen(true)}
          />
        </div>

        {/* Mobile Explorer Drawer */}
        {mobileExplorerOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex">
            <div className="w-80 h-full bg-[#061A32] flex flex-col p-2">
              <div className="flex justify-end p-2">
                <button
                  onClick={() => setMobileExplorerOpen(false)}
                  className="p-1.5 rounded-lg bg-[#0B2545] text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NoteExplorer
                notes={notes}
                categories={categories}
                selectedNoteId={selectedNoteId}
                activeSubView={activeSubView}
                selectedCategoryId={selectedCategoryId}
                onSelectSubView={(v) => {
                  setActiveSubView(v);
                  setLocalGraphNoteId(null);
                  setMobileExplorerOpen(false);
                }}
                onSelectCategory={(c) => {
                  setSelectedCategoryId(c);
                  setLocalGraphNoteId(null);
                  setMobileExplorerOpen(false);
                }}
                onSelectNote={(n) => {
                  selectNote(n);
                  setLocalGraphNoteId(null);
                  setMobileExplorerOpen(false);
                  if (activeSubView === 'graph') setActiveSubView('all');
                }}
                onCreateNewNote={(catId) => {
                  createNote({ category_id: catId });
                  setLocalGraphNoteId(null);
                  setMobileExplorerOpen(false);
                  if (activeSubView === 'graph') setActiveSubView('all');
                }}
                onOpenCategoryManager={() => {
                  setCategoryModalOpen(true);
                  setMobileExplorerOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* PANEL TENGAH: WORKSPACE (Editor OR Graph OR Empty State) */}
        <div className="flex-1 flex overflow-hidden min-w-0">
          {localGraphNoteId ? (
            /* LOCAL GRAPH VIEW */
            <KnowledgeGraphView
              notes={notes}
              categories={categories}
              links={allLinks}
              centerNoteId={localGraphNoteId}
              onSelectNote={(n) => {
                selectNote(n);
                setLocalGraphNoteId(null);
              }}
              onCloseLocalGraph={() => setLocalGraphNoteId(null)}
            />
          ) : activeSubView === 'graph' ? (
            /* GLOBAL KNOWLEDGE GRAPH VIEW */
            <KnowledgeGraphView
              notes={notes}
              categories={categories}
              links={allLinks}
              onSelectNote={(n) => {
                selectNote(n);
                setActiveSubView('all');
              }}
            />
          ) : selectedNote ? (
            /* NOTE EDITOR */
            <NoteEditor
              key={selectedNote.id}
              note={selectedNote}
              categories={categories}
              allNotes={notes}
              saveStatus={saveStatus}
              saveError={saveError}
              onUpdateNote={queueAutosave}
              onDeleteNote={deleteNote}
              onTogglePin={togglePin}
              onToggleFavorite={toggleFavorite}
              onToggleArchive={toggleArchive}
              onOpenNoteByTitle={handleOpenNoteByTitle}
              onCreateFromWikiLink={createNoteFromWikiLink}
              onOpenLocalGraph={handleOpenLocalGraph}
            />
          ) : (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center bg-[#061A32] border border-[#15385F] rounded-2xl p-8 text-center space-y-5 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0EA5E9]/20 via-[#0284C7]/20 to-[#22D3EE]/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
                <BrainCircuit className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Selamat Datang di Second Brain
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pusat penyimpanan pemikiran pribadi dan strategi bisnis Anda. Tulis catatan dalam format Markdown dan gunakan sintaks <span className="text-cyan-300 font-mono font-semibold">[[Judul Catatan]]</span> untuk menghubungkan ide-ide secara organik layaknya di Obsidian.
                </p>
              </div>

              {/* Feature Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg w-full text-left text-xs">
                <div className="p-3 rounded-xl bg-[#0B2545]/80 border border-[#1E3A5F] space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-mono text-[11px]">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Wiki Links</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ketik [[ untuk menghubungkan catatan secara dua arah.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0B2545]/80 border border-[#1E3A5F] space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-bold font-mono text-[11px]">
                    <Network className="w-3.5 h-3.5" />
                    <span>Knowledge Graph</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Visualisasikan konstelasi ide Anda secara interaktif.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#0B2545]/80 border border-[#1E3A5F] space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Autosave Cepat</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Perubahan tersimpan otomatis tanpa khawatir kehilangan data.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => createNote()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/20 transition transform hover:-translate-y-0.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Catatan Pertama</span>
                </button>
                <button
                  onClick={() => setActiveSubView('graph')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0B2545] hover:bg-[#15385F] text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold transition"
                >
                  <Network className="w-4 h-4" />
                  <span>Buka Knowledge Graph</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PANEL KANAN: KNOWLEDGE HUB (Desktop Collapsible) */}
        {selectedNote && activeSubView !== 'graph' && !localGraphNoteId && knowledgePanelOpen && (
          <div className="hidden lg:flex h-full">
            <KnowledgePanel
              note={selectedNote}
              categories={categories}
              onOpenNoteById={(id) => {
                selectNote(id);
                setLocalGraphNoteId(null);
              }}
              onOpenNoteByTitle={handleOpenNoteByTitle}
              onCreateFromWikiLink={createNoteFromWikiLink}
              onOpenLocalGraph={handleOpenLocalGraph}
            />
          </div>
        )}
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        notes={notes}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
      />
    </div>
  );
};
