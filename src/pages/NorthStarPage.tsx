/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Star,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useNorthStarGoals } from '../hooks/useNorthStarGoals';
import { NorthStarGoal } from '../types/database';
import { formatIDR, formatDateIndo, formatCompactIDR } from '../lib/formatters';

export const NorthStarPage: React.FC = () => {
  const {
    goals,
    coreDriver,
    loading,
    error,
    createGoal,
    updateGoal,
    setCoreDriver,
    deleteGoal,
    reorderGoals,
  } = useNorthStarGoals();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<NorthStarGoal | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(1000000000);
  const [targetYears, setTargetYears] = useState<number>(3);
  const [targetDeadline, setTargetDeadline] = useState('2029-12-31');
  const [emotionalReason, setEmotionalReason] = useState('');
  const [isCoreDriver, setIsCoreDriver] = useState(false);

  const openCreateModal = () => {
    if (goals.length >= 10) {
      setActionError('Maksimal 10 target North Star. Silakan hapus atau edit target yang sudah ada.');
      return;
    }
    setEditingGoal(null);
    setTitle('');
    setDescription('');
    setTargetAmount(1000000000);
    setTargetYears(3);
    setTargetDeadline('2029-12-31');
    setEmotionalReason('');
    setIsCoreDriver(goals.length === 0);
    setActionError(null);
    setModalOpen(true);
  };

  const openEditModal = (goal: NorthStarGoal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setTargetAmount(goal.target_amount);
    setTargetYears(goal.target_years || 1);
    setTargetDeadline(goal.target_deadline || '');
    setEmotionalReason(goal.emotional_reason || '');
    setIsCoreDriver(goal.is_core_driver);
    setActionError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetAmount <= 0 || targetYears <= 0) {
      setActionError('Judul, target nominal (> 0), dan durasi target (> 0) wajib diisi.');
      return;
    }

    setSaving(true);
    setActionError(null);

    if (editingGoal) {
      const res = await updateGoal(editingGoal.id, {
        title: title.trim(),
        description: description.trim(),
        target_amount: targetAmount,
        target_years: targetYears,
        target_deadline: targetDeadline,
        emotional_reason: emotionalReason.trim(),
        is_core_driver: isCoreDriver,
      });
      setSaving(false);
      if (res.error) {
        setActionError(res.error);
      } else {
        setModalOpen(false);
      }
    } else {
      const res = await createGoal({
        title: title.trim(),
        description: description.trim(),
        target_amount: targetAmount,
        target_years: targetYears,
        target_deadline: targetDeadline,
        emotional_reason: emotionalReason.trim(),
        is_core_driver: isCoreDriver,
        sort_order: goals.length,
      });
      setSaving(false);
      if (res.error) {
        setActionError(res.error);
      } else {
        setModalOpen(false);
      }
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === goals.length - 1)
    ) {
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...goals];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    await reorderGoals(reordered);
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus target "${title}"?`)) {
      const res = await deleteGoal(id);
      if (res.error) {
        setActionError(res.error);
      }
    }
  };

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E4575] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-cyan-400" />
            <span>North Star Goals</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visi jangka panjang dan satu-satunya sasaran nominal finansial. Maksimal 10 sasaran dengan 1 Core Driver aktif.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-mono bg-[#0B2545] px-3 py-1.5 rounded-xl border border-[#1E4575]">
            {goals.length} / 10 Target Terdaftar
          </span>
          <button
            onClick={openCreateModal}
            disabled={goals.length >= 10}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> <span>Tambah Target</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Featured Core Driver Highlight Card (Hero Banner) */}
      {coreDriver ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C2A4D] via-[#103A6B] to-[#0A2240] border border-[#1E4D7E]/70 p-6 md:p-8 space-y-4 shadow-2xl shadow-black/40">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-cyan-400 via-blue-500 to-indigo-600" />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#071B35]/80 border border-cyan-500/30 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Core Driver Aktif — Single Financial Anchor</span>
            </span>
            <span className="text-xs text-slate-300 font-mono bg-[#071B35]/70 px-3 py-1 rounded-lg border border-[#1E4575]">
              Tenggat: {formatDateIndo(coreDriver.target_deadline)}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {coreDriver.title}
            </h2>
            {coreDriver.description && (
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                {coreDriver.description}
              </p>
            )}
            {coreDriver.emotional_reason && (
              <div className="p-3.5 bg-[#071B35]/80 border border-cyan-500/30 rounded-xl text-xs text-cyan-200/90 italic border-l-2 border-l-cyan-400">
                <strong className="text-cyan-300 font-semibold">Alasan Emosional:</strong> "{coreDriver.emotional_reason}"
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#1E4575]">
            <div className="p-3 rounded-xl bg-[#071B35]/70 border border-[#1E4575]">
              <span className="text-[11px] text-slate-400">Total Sasaran Finansial</span>
              <p className="text-xl font-bold font-mono text-white mt-0.5">
                {formatIDR(coreDriver.target_amount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#071B35]/70 border border-[#1E4575]">
              <span className="text-[11px] text-slate-400">Durasi Target</span>
              <p className="text-xl font-bold font-mono text-slate-200 mt-0.5">
                {coreDriver.target_years} Tahun
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#071B35]/70 border border-cyan-500/30">
              <span className="text-[11px] text-cyan-300">Target Rata-rata Bulanan</span>
              <p className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {formatIDR(coreDriver.target_amount / ((coreDriver.target_years || 1) * 12))}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Belum Ada Core Driver Terpilih</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Sistem membutuhkan tepat 1 Core Driver untuk menjadi acuan tunggal target tahunan, bulanan, dan alokasi unit penjualan 3 bisnis. Klik "Jadikan Core Driver" pada salah satu target di bawah.
          </p>
        </section>
      )}

      {/* Goals List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-5 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Daftar Sasaran North Star ({goals.length}/10)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Urutan menentukan hierarki prioritas
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Memuat daftar target North Star...
          </div>
        ) : goals.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#1E4575] rounded-2xl bg-[#0B2545]/50 space-y-3">
            <Compass className="w-10 h-10 text-cyan-500/50 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Belum Ada Target yang Dibuat</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mulailah dengan mendefinisikan target North Star pertama Anda dan tetapkan sebagai Core Driver.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" /> Buat Target Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {goals.map((goal, index) => {
              const annualAmount = goal.target_amount / (goal.target_years || 1);
              const monthlyAmount = annualAmount / 12;

              return (
                <div
                  key={goal.id}
                  className={`enterprise-card p-5 transition-all shadow-md ${
                    goal.is_core_driver
                      ? 'border-cyan-500/50 bg-[#0E2F54]'
                      : 'hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {goal.is_core_driver && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase font-mono flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Core Driver
                          </span>
                        )}
                        <h4 className="text-base font-bold text-white">{goal.title}</h4>
                      </div>

                      {goal.description && (
                        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                          {goal.description}
                        </p>
                      )}

                      {goal.emotional_reason && (
                        <p className="text-xs text-slate-300 italic">
                          <strong className="text-slate-400 font-medium">Alasan Emosional:</strong> "{goal.emotional_reason}"
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400 pt-1">
                        <span>
                          Total: <strong className="text-white font-mono">{formatIDR(goal.target_amount)}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Durasi: <strong className="text-slate-200 font-mono">{goal.target_years} Tahun</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Target/Bulan: <strong className="text-cyan-300 font-mono">{formatIDR(monthlyAmount)}</strong>
                        </span>
                        {goal.target_deadline && (
                          <>
                            <span>·</span>
                            <span>
                              Tenggat: <span className="font-mono text-slate-300">{formatDateIndo(goal.target_deadline)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                      {!goal.is_core_driver ? (
                        <button
                          onClick={() => setCoreDriver(goal.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-cyan-300 bg-[#0B2545] hover:bg-[#15385F] border border-[#1E4575] hover:border-cyan-500/40 rounded-xl transition flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5" /> Jadikan Core Driver
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Terpilih
                        </span>
                      )}

                      <div className="flex items-center bg-[#071B35] border border-[#1E4575] rounded-xl p-0.5">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          title="Naikkan urutan"
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={index === goals.length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          title="Turunkan urutan"
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => openEditModal(goal)}
                        title="Edit Target"
                        className="p-2 text-slate-300 hover:text-white bg-[#0B2545] hover:bg-[#15385F] border border-[#1E4575] rounded-xl transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(goal.id, goal.title)}
                        title="Hapus Target"
                        className="p-2 text-slate-300 hover:text-rose-400 bg-[#0B2545] hover:bg-[#15385F] border border-[#1E4575] rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Create/Edit Goal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#102D50] border border-[#1E4575] rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingGoal ? 'Edit Target North Star' : 'Tambah Target North Star Baru'}
            </h3>
            <p className="text-xs text-slate-400">
              Maksimal 10 target per pengguna. Target ini akan langsung memperbarui kalkulasi hierarki finansial.
            </p>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Judul Target <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bebas Finansial & Ekspansi Agensi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Deskripsi Visi
                </label>
                <textarea
                  rows={2}
                  placeholder="Jelaskan gambaran kondisi ketika target ini terwujud..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Target Finansial (IDR) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[11px] text-cyan-300 font-mono mt-1 block">
                    {formatIDR(targetAmount)}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Durasi Target (Tahun) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={targetYears}
                    onChange={(e) => setTargetYears(Number(e.target.value))}
                    className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Tenggat Waktu (Target Deadline)
                </label>
                <input
                  type="date"
                  value={targetDeadline}
                  onChange={(e) => setTargetDeadline(e.target.value)}
                  className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Alasan Emosional (Emotional Reason)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mengapa target ini sangat berarti bagi Anda, keluarga, atau misi hidup?"
                  value={emotionalReason}
                  onChange={(e) => setEmotionalReason(e.target.value)}
                  className="w-full bg-[#071B35] border border-[#1E4575] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCoreDriver}
                    onChange={(e) => setIsCoreDriver(e.target.checked)}
                    className="w-4 h-4 rounded border-[#1E4575] bg-[#071B35] text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-medium text-slate-200">
                    Pilih target ini sebagai Core Driver utama
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E4575]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#0B2545] rounded-xl border border-[#1E4575] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {saving ? 'Menyimpan...' : editingGoal ? 'Simpan Perubahan' : 'Buat Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
