/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Plus,
  Repeat,
  Sparkles,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  Sliders,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  useRecurringTemplates,
  DAY_NAMES,
  DEFAULT_RECURRING_TEMPLATES,
} from '../../hooks/useRecurringTemplates';
import { RecurringTaskTemplate, TaskPriority, TaskType } from '../../types/database';

interface RecurringScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncTasks: () => Promise<{ success: boolean; generatedCount: number; error: string | null }>;
}

export const RecurringScheduleModal: React.FC<RecurringScheduleModalProps> = ({
  isOpen,
  onClose,
  onSyncTasks,
}) => {
  const {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    toggleTemplateActive,
    deleteTemplate,
    seedDefaultTemplates,
  } = useRecurringTemplates();

  // Filters
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedBusinessFilter, setSelectedBusinessFilter] = useState<string>('all');

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Template Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTaskTemplate | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [businessKey, setBusinessKey] = useState<string>('jamu_herbal');
  const [taskType, setTaskType] = useState<TaskType>('support_task');
  const [priority, setPriority] = useState<TaskPriority>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [outreachCount, setOutreachCount] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Confirmation States
  const [confirmDefaultOpen, setConfirmDefaultOpen] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenCreateForm = (defaultDay?: number) => {
    setEditingTemplate(null);
    setDayOfWeek(defaultDay || (selectedDayFilter !== 'all' ? selectedDayFilter : 1));
    setBusinessKey(selectedBusinessFilter !== 'all' ? selectedBusinessFilter : 'jamu_herbal');
    setTaskType('support_task');
    setPriority('high');
    setTitle('');
    setDescription('');
    setEstimatedMinutes(45);
    setOutreachCount(0);
    setIsActive(true);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (tmpl: RecurringTaskTemplate) => {
    setEditingTemplate(tmpl);
    setDayOfWeek(tmpl.day_of_week);
    setBusinessKey(tmpl.business_key || 'jamu_herbal');
    setTaskType(tmpl.task_type);
    setPriority((typeof tmpl.priority === 'string' ? tmpl.priority : 'high') as TaskPriority);
    setTitle(tmpl.title);
    setDescription(tmpl.description || '');
    setEstimatedMinutes(tmpl.estimated_minutes || 45);
    setOutreachCount(tmpl.outreach_count || 0);
    setIsActive(tmpl.is_active);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Judul aktivitas tugas wajib diisi.');
      return;
    }
    if (estimatedMinutes <= 0) {
      setFormError('Estimasi durasi harus lebih dari 0 menit.');
      return;
    }

    setFormSaving(true);
    setFormError(null);

    if (editingTemplate) {
      const res = await updateTemplate(editingTemplate.id, {
        title: title.trim(),
        description,
        business_key: businessKey,
        day_of_week: dayOfWeek,
        task_type: taskType,
        priority,
        estimated_minutes: estimatedMinutes,
        outreach_count: outreachCount,
        is_active: isActive,
      });
      setFormSaving(false);
      if (!res.success) {
        setFormError(res.error || 'Gagal memperbarui template.');
      } else {
        setIsFormOpen(false);
      }
    } else {
      const res = await createTemplate({
        title: title.trim(),
        description,
        business_key: businessKey,
        day_of_week: dayOfWeek,
        task_type: taskType,
        priority,
        estimated_minutes: estimatedMinutes,
        outreach_count: outreachCount,
        is_active: isActive,
      });
      setFormSaving(false);
      if (!res.success) {
        setFormError(res.error || 'Gagal menambah template.');
      } else {
        setIsFormOpen(false);
      }
    }
  };

  const handleApplyDefaultTemplates = async () => {
    setSeedingLoading(true);
    setSeedResult(null);
    const res = await seedDefaultTemplates();
    setSeedingLoading(false);
    setConfirmDefaultOpen(false);
    if (res.success) {
      if (res.insertedCount > 0) {
        setSeedResult(`Berhasil menambahkan ${res.insertedCount} template konten default!`);
      } else {
        setSeedResult('Semua template konten default sudah terpasang lengkap.');
      }
      setTimeout(() => setSeedResult(null), 4000);
    } else {
      setSeedResult(`Gagal memasang template: ${res.error}`);
      setTimeout(() => setSeedResult(null), 5000);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await onSyncTasks();
    setSyncing(false);
    if (res.success) {
      setSyncResult(
        res.generatedCount > 0
          ? `Berhasil! ${res.generatedCount} tugas berulang baru dimasukkan ke Execution Board.`
          : 'Sinkronisasi berhasil: seluruh tugas jadwal minggu ini sudah tersedia di Execution Board.'
      );
      setTimeout(() => setSyncResult(null), 4000);
    } else {
      setSyncResult(`Gagal sinkronisasi: ${res.error}`);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await deleteTemplate(id);
    setDeletingId(null);
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (selectedDayFilter !== 'all' && t.day_of_week !== selectedDayFilter) return false;
    if (selectedBusinessFilter !== 'all' && t.business_key !== selectedBusinessFilter) return false;
    return true;
  });

  const activeCount = templates.filter((t) => t.is_active).length;

  const getBusinessBadge = (bKey?: string) => {
    switch (bKey) {
      case 'jamu_herbal':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            Jamu Herbal
          </span>
        );
      case 'akademi_spiritual':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Akademi Spiritual
          </span>
        );
      case 'pakar_digital':
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Pakar Digital
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#071B35] text-slate-400 border border-[#1E4575]">
            Umum
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0B2545] border border-[#1E4575] rounded-2xl w-full max-w-5xl my-auto p-5 sm:p-7 space-y-6 shadow-2xl relative text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#1E4575] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <Repeat className="w-4 h-4" />
              <span>Sistem Otomasi Rutinitas Mingguan</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Kelola Jadwal Tugas Berulang</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                {activeCount}/{templates.length} Aktif
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Buat jadwal sekali, sistem otomatis membuat Task aktual setiap minggu dan memasukkannya ke Prioritas Hari Ini sesuai kapasitas Rule of 3.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#071B35] hover:bg-[#15385F] text-slate-400 hover:text-white border border-[#1E4575] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Toast / Seed Notification */}
        {syncResult && (
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncResult}</span>
          </div>
        )}

        {seedResult && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{seedResult}</span>
          </div>
        )}

        {/* Action Controls & Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenCreateForm()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Template</span>
            </button>

            <button
              onClick={() => setConfirmDefaultOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#102D50] hover:bg-[#15385F] text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
              title="Isi otomatis 15 template mingguan untuk 3 bisnis (Senin-Jumat)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gunakan Jadwal Konten Default (15 Template)</span>
            </button>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#071B35] hover:bg-[#15385F] text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            title="Sinkronkan jadwal dan buat tugas aktual ke Execution Board sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Menghasilkan Task...' : 'Sinkronkan & Buat Task Sekarang'}</span>
          </button>
        </div>

        {/* Filter Tabs: Days & Business */}
        <div className="space-y-3 pt-1 border-t border-[#1E4575] shrink-0">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-semibold text-slate-400 mr-1.5 whitespace-nowrap">
              Hari:
            </span>
            <button
              onClick={() => setSelectedDayFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedDayFilter === 'all'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                  : 'bg-[#071B35] text-slate-300 hover:text-white border border-[#1E4575]'
              }`}
            >
              Semua Hari ({templates.length})
            </button>
            {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
              const dayName = DAY_NAMES[dayNum];
              const countInDay = templates.filter((t) => t.day_of_week === dayNum).length;
              return (
                <button
                  key={dayNum}
                  onClick={() => setSelectedDayFilter(dayNum)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                    selectedDayFilter === dayNum
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm'
                      : 'bg-[#071B35] text-slate-300 hover:text-white border border-[#1E4575]'
                  }`}
                >
                  <span>{dayName}</span>
                  <span className="text-[10px] font-mono opacity-70">({countInDay})</span>
                  {dayNum >= 6 && countInDay === 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-700/60 text-slate-400">
                      Libur
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Business Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-semibold text-slate-400 mr-1.5 whitespace-nowrap">
              Bisnis:
            </span>
            {[
              { id: 'all', label: 'Semua Bisnis' },
              { id: 'jamu_herbal', label: 'Jamu Herbal' },
              { id: 'akademi_spiritual', label: 'Akademi Spiritual' },
              { id: 'pakar_digital', label: 'Pakar Digital' },
              { id: 'general', label: 'Umum' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBusinessFilter(b.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedBusinessFilter === b.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'bg-[#071B35]/60 text-slate-400 hover:text-slate-200 border border-[#1E4575]/50'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template List Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[260px]">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
              <span>Memuat jadwal template...</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#1E4575] bg-[#071B35]/50 p-6 space-y-3">
              <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Belum Ada Template Jadwal</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {selectedDayFilter !== 'all'
                    ? `Tidak ada template untuk hari ${DAY_NAMES[selectedDayFilter]}. Klik "+ Tambah Template" atau gunakan jadwal konten default.`
                    : 'Pasang rutinitas mingguan promosi konten untuk 3 bisnis agar tugas terbuat otomatis.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setConfirmDefaultOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-xs transition shadow-md"
                >
                  Pasang 15 Template Default
                </button>
                <button
                  onClick={() => handleOpenCreateForm(typeof selectedDayFilter === 'number' ? selectedDayFilter : 1)}
                  className="px-4 py-2 bg-[#102D50] hover:bg-[#15385F] border border-[#1E4575] text-white rounded-xl text-xs font-semibold transition"
                >
                  + Buat Manual
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredTemplates.map((tmpl) => {
                const dayName = DAY_NAMES[tmpl.day_of_week] || `Hari ${tmpl.day_of_week}`;
                const isLead = tmpl.task_type === 'lead_measure';

                return (
                  <div
                    key={tmpl.id}
                    className={`rounded-2xl border p-4 space-y-3 transition flex flex-col justify-between ${
                      tmpl.is_active
                        ? 'bg-[#102D50]/90 border-[#1E4575] hover:border-cyan-500/50 shadow-md'
                        : 'bg-[#071B35]/70 border-[#1E4575]/50 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges & Toggle */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Day badge */}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#071B35] text-cyan-300 border border-cyan-500/30 font-mono">
                            {dayName}
                          </span>
                          {/* Business badge */}
                          {getBusinessBadge(tmpl.business_key)}
                          {/* Type */}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                              isLead
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : 'bg-[#071B35] text-slate-300 border border-[#1E4575]'
                            }`}
                          >
                            {isLead ? 'Lead Measure' : 'Support'}
                          </span>
                          {/* Priority */}
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                              tmpl.priority === 'high' || tmpl.priority === 1
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                : 'bg-[#071B35] text-slate-400 border border-[#1E4575]'
                            }`}
                          >
                            {tmpl.priority === 'high' || tmpl.priority === 1 ? 'High' : 'Normal'}
                          </span>
                        </div>

                        {/* Active Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleTemplateActive(tmpl.id, tmpl.is_active)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            tmpl.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                          }`}
                          title={tmpl.is_active ? 'Nonaktifkan template' : 'Aktifkan template'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              tmpl.is_active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-white leading-snug">{tmpl.title}</h4>

                      {/* Multiline description */}
                      {tmpl.description && (
                        <p
                          className="text-[11px] text-slate-300/90 whitespace-pre-wrap break-words leading-relaxed max-h-24 overflow-y-auto pr-1 bg-[#071B35]/40 p-2 rounded-xl border border-[#1E4575]/40"
                          style={{ overflowWrap: 'anywhere' }}
                        >
                          {tmpl.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Metadata & Actions */}
                    <div className="pt-2 border-t border-[#1E4575] flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-2.5 font-mono text-[10px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{tmpl.estimated_minutes} mnt</span>
                        </span>
                        {Number(tmpl.outreach_count) > 0 && (
                          <span className="text-emerald-300">
                            🎯 {tmpl.outreach_count} outreach
                          </span>
                        )}
                        <span className={tmpl.is_active ? 'text-emerald-400' : 'text-slate-500'}>
                          ● {tmpl.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditForm(tmpl)}
                          className="p-1 rounded-lg hover:bg-[#15385F] text-slate-400 hover:text-cyan-300 transition"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(tmpl.id)}
                          className="p-1 rounded-lg hover:bg-[#15385F] text-slate-400 hover:text-rose-400 transition"
                          title="Hapus Template"
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
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#1E4575] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Otomasi aktif: generator berjalan otomatis saat Execution Board dibuka (Asia/Jakarta).
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#071B35] hover:bg-[#15385F] text-white border border-[#1E4575] rounded-xl text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>

        {/* MODAL: ADD / EDIT TEMPLATE FORM */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#102D50] border border-[#1E4575] rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#1E4575] pb-3">
                <h3 className="font-bold text-white text-base">
                  {editingTemplate ? 'Edit Template Jadwal' : 'Tambah Template Jadwal Baru'}
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#15385F]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveForm} className="space-y-4">
                {/* Day of Week & Business */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Hari Pelaksanaan
                    </label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value={1}>Senin (Hari 1)</option>
                      <option value={2}>Selasa (Hari 2)</option>
                      <option value={3}>Rabu (Hari 3)</option>
                      <option value={4}>Kamis (Hari 4)</option>
                      <option value={5}>Jumat (Hari 5)</option>
                      <option value={6}>Sabtu (Hari 6 - Libur)</option>
                      <option value={7}>Minggu (Hari 7 - Libur)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bisnis
                    </label>
                    <select
                      value={businessKey}
                      onChange={(e) => setBusinessKey(e.target.value)}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="jamu_herbal">Jamu Herbal</option>
                      <option value="akademi_spiritual">Akademi Spiritual</option>
                      <option value="pakar_digital">Pakar Digital</option>
                      <option value="general">Umum</option>
                    </select>
                  </div>
                </div>

                {/* Task Type & Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tipe Aktivitas
                    </label>
                    <select
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value as TaskType)}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="support_task">Support Task (Aktivitas Pendukung)</option>
                      <option value="lead_measure">Lead Measure (Tindakan Penjualan Langsung)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Prioritas
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="high">Tinggi (P1 - Utama)</option>
                      <option value="medium">Sedang (P2 - Normal)</option>
                      <option value="low">Rendah (P3)</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Judul Aktivitas Tugas <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Riset Konten Promosi Jamu Herbal"
                    className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Description (Multiline) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Keterangan / Checklist Detail (Multiline)
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tekan Enter untuk baris baru. Format baris baru akan dipertahankan sepenuhnya pada kartu tugas..."
                    className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 leading-relaxed font-sans resize-y"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter satu kali = ganti baris. Enter dua kali = baris kosong.
                  </p>
                </div>

                {/* Duration & Outreach */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Estimasi Durasi (Menit)
                    </label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(Math.max(5, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Outreach (Kontak)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={outreachCount}
                      onChange={(e) => setOutreachCount(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#071B35] border border-[#1E4575] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#071B35] border border-[#1E4575]">
                  <div>
                    <span className="text-xs font-semibold text-white block">Status Aktif</span>
                    <span className="text-[10px] text-slate-400">
                      Jika aktif, tugas akan digenerate otomatis setiap minggu.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E4575]">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-[#071B35] hover:bg-[#15385F] border border-[#1E4575] rounded-xl text-xs font-semibold text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {formSaving ? 'Menyimpan...' : editingTemplate ? 'Perbarui Template' : 'Simpan Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRMATION: DEFAULT TEMPLATES */}
        {confirmDefaultOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#102D50] border border-amber-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-white">
              <div className="flex items-center gap-3 text-amber-400">
                <Sparkles className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-white">Pasang 15 Template Konten Default?</h3>
              </div>
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  Sistem akan membuat 15 jadwal tugas mingguan promosi konten untuk 3 bisnis:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px] bg-[#071B35] p-3 rounded-xl border border-[#1E4575]">
                  <li>Senin: Riset Konten Promosi (3 bisnis)</li>
                  <li>Selasa: Membuat Skrip Konten (3 bisnis)</li>
                  <li>Rabu: Rekaman Konten (3 bisnis)</li>
                  <li>Kamis: Editing Konten (3 bisnis)</li>
                  <li>Jumat: Jadwalkan & Publikasikan (3 bisnis)</li>
                  <li className="text-slate-500">Sabtu & Minggu: Libur</li>
                </ul>
                <p className="text-[11px] text-cyan-300">
                  ✓ Sistem aman dan mencegah duplikasi otomatis jika sebagian template sudah ada.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E4575]">
                <button
                  type="button"
                  disabled={seedingLoading}
                  onClick={() => setConfirmDefaultOpen(false)}
                  className="px-4 py-2 bg-[#071B35] hover:bg-[#15385F] border border-[#1E4575] rounded-xl text-xs font-semibold text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={seedingLoading}
                  onClick={handleApplyDefaultTemplates}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {seedingLoading ? 'Memasang Template...' : 'Ya, Pasang 15 Template'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMATION: DELETE TEMPLATE */}
        {deletingId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#102D50] border border-rose-500/40 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl relative text-white">
              <div className="flex items-center gap-2.5 text-rose-400">
                <Trash2 className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold text-white">Hapus Template Jadwal?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Template ini akan dihapus dari jadwal rutin. Task yang sudah digenerate sebelumnya di papan eksekusi tidak akan terhapus.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E4575]">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  className="px-3.5 py-1.5 bg-[#071B35] hover:bg-[#15385F] border border-[#1E4575] rounded-xl text-xs text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTemplate(deletingId)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
