/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Calendar,
  AlertCircle,
  Tag,
  Palette,
  Sun,
  Activity,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Heart,
  Coffee,
  Target,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import { HabitItem } from '../../types/habitTracker';
import { getJakartaToday } from '../../utils/habitMath';

export const HABIT_PALETTE_COLORS = [
  '#0EA5E9', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

export const HABIT_CATEGORIES_PRESETS = [
  'Personal',
  'Health',
  'Learning',
  'Business',
  'Spiritual',
  'Productivity',
];

export const HABIT_ICONS = [
  { id: 'check-circle', label: 'Check', icon: CheckCircle2 },
  { id: 'sun', label: 'Matahari', icon: Sun },
  { id: 'activity', label: 'Kesehatan', icon: Activity },
  { id: 'book-open', label: 'Buku', icon: BookOpen },
  { id: 'trending-up', label: 'Bisnis', icon: TrendingUp },
  { id: 'heart', label: 'Jantung', icon: Heart },
  { id: 'coffee', label: 'Pagi', icon: Coffee },
  { id: 'target', label: 'Target', icon: Target },
  { id: 'sparkles', label: 'Fokus', icon: Sparkles },
  { id: 'zap', label: 'Energi', icon: Zap },
];

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingHabit?: HabitItem | null;
  onSave: (habitData: Partial<HabitItem>) => Promise<{ success: boolean; error: string | null }>;
}

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  editingHabit,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [color, setColor] = useState('#0EA5E9');
  const [icon, setIcon] = useState('check-circle');
  const [scheduledTime, setScheduledTime] = useState('');
  const [startDate, setStartDate] = useState(getJakartaToday());
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingHabit) {
      setTitle(editingHabit.title);
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category || 'Personal');
      setColor(editingHabit.color || '#0EA5E9');
      setIcon(editingHabit.icon || 'check-circle');
      setScheduledTime(editingHabit.scheduled_time ? editingHabit.scheduled_time.slice(0, 5) : '');
      setStartDate(editingHabit.start_date || getJakartaToday());
      setSortOrder(editingHabit.sort_order || 1);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Personal');
      setColor(HABIT_PALETTE_COLORS[0]);
      setIcon('check-circle');
      setScheduledTime('');
      setStartDate(getJakartaToday());
      setSortOrder(1);
    }
    setErrorMsg(null);
  }, [editingHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Nama kebiasaan wajib diisi.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const res = await onSave({
      title: title.trim(),
      description: description.trim() || null,
      category,
      color,
      icon,
      scheduled_time: scheduledTime ? scheduledTime.trim() : null,
      start_date: startDate,
      sort_order: sortOrder,
    });

    setSaving(false);
    if (!res.success) {
      setErrorMsg(res.error || 'Gagal menyimpan kebiasaan.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B2545] border border-[#1E3A5F] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-white my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}50`,
                color: color,
              }}
            >
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingHabit ? 'Edit Kebiasaan Harian' : 'Tambah Kebiasaan Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Disiplin harian yang dipantau konsistensinya setiap hari.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Nama Kebiasaan <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Bangun pukul 05.00 / Olahraga 30 menit"
              className="w-full px-3.5 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block">
              Keterangan / Tujuan Kebiasaan (Opsional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Menjaga vitalitas tubuh dan fokus energi harian"
              className="w-full px-3.5 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Category, Start Date & Scheduled Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {HABIT_CATEGORIES_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>Jadwal Jam</span>
                </label>
                <span className="text-[10px] text-slate-400">24 Jam</span>
              </div>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="--:--"
                className="w-full px-3 py-2 bg-[#071B35] border border-[#1E3A5F] rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-sans -mt-2">
            💡 Jadwal jam opsional (misal: 05:00, 08:30). Habit dengan jadwal akan diurutkan lebih awal di checklist harian.
          </p>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Pilih Ikon</label>
            <div className="grid grid-cols-5 gap-2">
              {HABIT_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                        : 'bg-[#071B35] text-slate-400 hover:text-white border-[#1E3A5F]'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="text-[10px] truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Warna Aksen</label>
            <div className="flex items-center gap-2 flex-wrap">
              {HABIT_PALETTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? '#FFFFFF' : 'transparent',
                  }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E3A5F]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#071B35] hover:bg-[#102D50] border border-[#1E3A5F] rounded-xl text-xs font-semibold text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : editingHabit ? 'Perbarui Kebiasaan' : 'Simpan Kebiasaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
