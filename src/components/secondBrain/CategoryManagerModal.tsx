/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  FolderPlus,
  Check,
  AlertCircle,
  Folder,
} from 'lucide-react';
import { NoteCategory, Note } from '../../types/secondBrain';

const PALETTE_COLORS = [
  '#0EA5E9', // Cyan
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#EC4899', // Pink
  '#64748B', // Slate
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NoteCategory[];
  notes: Note[];
  onCreateCategory: (cat: { name: string; description?: string; color: string; icon?: string }) => Promise<any>;
  onUpdateCategory: (id: string, updates: Partial<NoteCategory>) => Promise<any>;
  onDeleteCategory: (id: string) => Promise<any>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  notes,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#0EA5E9');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingId('new');
    setName('');
    setDescription('');
    setColor(PALETTE_COLORS[Math.floor(Math.random() * PALETTE_COLORS.length)]);
    setErrorMsg(null);
  };

  const handleOpenEdit = (cat: NoteCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || '#0EA5E9');
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    if (editingId === 'new') {
      const res = await onCreateCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        icon: 'folder',
      });
      setSaving(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal membuat kategori.');
      } else {
        setEditingId(null);
      }
    } else if (editingId) {
      const res = await onUpdateCategory(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      setSaving(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Gagal memperbarui kategori.');
      } else {
        setEditingId(null);
      }
    }
  };

  const handleDelete = async (id: string) => {
    await onDeleteCategory(id);
    setDeletingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B2545] border border-[#1E3A5F] rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Kelola Kategori Catatan</h3>
              <p className="text-xs text-slate-400">
                Kelompokkan pengetahuan pribadi berdasarkan pilar kehidupan dan strategi bisnis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#071B35] hover:bg-[#102D50] text-slate-400 hover:text-white border border-[#1E3A5F] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Add / Edit */}
        {editingId !== null && (
          <form onSubmit={handleSave} className="p-4 rounded-xl bg-[#071B35] border border-[#1E3A5F] space-y-3.5">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              {editingId === 'new' ? '+ Tambah Kategori Baru' : 'Edit Kategori'}
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Nama Kategori</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Strategi Bisnis"
                className="w-full px-3 py-1.5 bg-[#0B2545] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Deskripsi Singkat</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan ringkas tentang isi kategori ini"
                className="w-full px-3 py-1.5 bg-[#0B2545] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            {/* Color Palette */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">Warna Aksen</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? '#FFFFFF' : 'transparent',
                    }}
                  >
                    {color === c && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-3 py-1.5 rounded-xl bg-[#0B2545] text-slate-300 hover:text-white text-xs border border-[#1E3A5F]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        )}

        {/* Category List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Daftar Kategori ({categories.length})
            </span>
            {editingId === null && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#102D50] hover:bg-[#15385F] text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kategori Baru</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const noteCount = notes.filter((n) => n.category_id === cat.id && !n.is_archived).length;

              return (
                <div
                  key={cat.id}
                  className="p-3 rounded-xl bg-[#071B35]/80 border border-[#1E3A5F] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white truncate">{cat.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({noteCount} catatan)
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-slate-400 truncate">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-[#102D50] transition"
                      title="Edit Kategori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(cat.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#102D50] transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete Confirmation */}
        {deletingId && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-white space-y-2">
            <p className="font-bold text-rose-300">Konfirmasi Hapus Kategori</p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Catatan di dalam kategori ini tidak akan dihapus. Semua catatan yang ada akan dipindahkan menjadi "Tanpa Kategori".
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3 py-1 rounded-lg bg-[#0B2545] text-slate-300 hover:text-white border border-[#1E3A5F]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-3.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Hapus
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-[#1E3A5F] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#071B35] hover:bg-[#15385F] text-slate-300 hover:text-white border border-[#1E3A5F] text-xs font-semibold"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
