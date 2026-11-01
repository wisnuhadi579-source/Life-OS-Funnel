/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  Bot,
  ExternalLink,
  Info,
  Package,
  Layers,
  Compass,
  Cpu,
} from 'lucide-react';
import { useMonthlyEvaluations } from '../hooks/useMonthlyEvaluations';
import { useNorthStarGoals } from '../hooks/useNorthStarGoals';
import { useLifeProfile } from '../hooks/useLifeProfile';
import { useBusinessTargets } from '../contexts/BusinessTargetsContext';
import { useBusinessSales } from '../hooks/useBusinessSales';
import { calculateFinancialMetrics, calculateBusinessSalesTarget } from '../lib/financialMath';
import {
  formatIDR,
  formatCompactIDR,
  formatPercent,
  formatMonthYearIndo,
  getCurrentMonthStart,
  getAvailableMonthOptions,
} from '../lib/formatters';

export const AiPromptGeneratorPage: React.FC = () => {
  const currentMonth = getCurrentMonthStart();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const monthOptions = getAvailableMonthOptions();

  const { evaluations } = useMonthlyEvaluations();
  const { coreDriver } = useNorthStarGoals();
  const { profile } = useLifeProfile();
  const { targets: businessTargets } = useBusinessTargets();
  const { monthlyTotals } = useBusinessSales(`${selectedMonth}-01`);

  const [copied, setCopied] = useState(false);

  // Find evaluation for selected month
  const targetEval = evaluations.find((e) => e.month_start === selectedMonth);

  // Derive target figures
  const metrics = calculateFinancialMetrics(coreDriver, profile, null);
  const monthlyNorthStar = targetEval?.monthly_target ?? metrics.monthlyTarget;
  const actualProfit = targetEval?.actual_net_profit ?? null;
  const achievementPct =
    monthlyNorthStar > 0 && actualProfit !== null ? (actualProfit / monthlyNorthStar) * 100 : null;
  const gap = actualProfit !== null ? monthlyNorthStar - actualProfit : null;

  // Derive 3 business targets
  const jamuTarget = businessTargets.find((t) => t.business_key === 'jamu_herbal');
  const spiritualTarget = businessTargets.find((t) => t.business_key === 'akademi_spiritual');
  const pakarTarget = businessTargets.find((t) => t.business_key === 'pakar_digital');

  const jamuCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    jamuTarget?.allocation_percentage ?? 10,
    jamuTarget?.profit_per_unit ?? 10000,
    jamuTarget?.planning_days_per_month ?? 30,
    jamuTarget?.sales_unit ?? 'botol 500 ml',
    'jamu_herbal'
  );

  const spiritualCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    spiritualTarget?.allocation_percentage ?? 50,
    spiritualTarget?.profit_per_unit ?? 10000,
    spiritualTarget?.planning_days_per_month ?? 30,
    spiritualTarget?.sales_unit ?? 'member',
    'akademi_spiritual'
  );

  const pakarCalc = calculateBusinessSalesTarget(
    monthlyNorthStar,
    pakarTarget?.allocation_percentage ?? 40,
    pakarTarget?.profit_per_unit ?? 50000,
    pakarTarget?.planning_days_per_month ?? 30,
    pakarTarget?.sales_unit ?? 'produk',
    'pakar_digital'
  );

  // Business sales figures from snapshot or live monthly totals
  const jamuSold =
    targetEval?.business_sales_snapshot?.jamu_herbal ?? monthlyTotals['jamu_herbal'] ?? 0;
  const spiritualSold =
    targetEval?.business_sales_snapshot?.akademi_spiritual ?? monthlyTotals['akademi_spiritual'] ?? 0;
  const pakarSold =
    targetEval?.business_sales_snapshot?.pakar_digital ?? monthlyTotals['pakar_digital'] ?? 0;

  // Build the Indonesian Prompt according to V2 specification
  const generatePrompt = (): string => {
    const monthLabel = formatMonthYearIndo(selectedMonth);

    const goalTitle = coreDriver?.title || 'Core Driver Utama';
    const totalTarget = targetEval?.vision_target_amount ?? (coreDriver?.target_amount || 0);
    const targetYears = targetEval?.target_years_snapshot ?? (coreDriver?.target_years || 1);
    const annualTarget = targetEval?.annual_target_snapshot ?? (totalTarget / targetYears);

    const outreach = targetEval?.outreach_count ?? 0;
    const hours = targetEval?.total_work_hours ?? 0;
    const consistentDays = targetEval?.consistent_work_days ?? 0;

    const wins = targetEval?.wins || '(Belum dicatat)';
    const obstacles = targetEval?.obstacles || '(Belum dicatat)';
    const lessons = targetEval?.lessons_learned || '(Belum dicatat)';
    const adjustments = targetEval?.next_month_adjustments || '(Belum dicatat)';

    return `Anda adalah seorang Executive Business Strategist dan Performance Coach kelas dunia.
Saya meminta Anda menganalisis performa bisnis dan efektivitas eksekusi harian saya untuk periode ${monthLabel} menggunakan filosofi "Life OS Funnel V2: Single North Star, Multi-Business Execution".

=======================================================
1. TARGET FINANSIAL TUNGGAL (NORTH STAR)
=======================================================
- Sasaran North Star (Core Driver): ${goalTitle}
- Target Total Jangka Panjang: ${formatIDR(totalTarget)} (${targetYears} Tahun)
- Target Net Profit Tahunan: ${formatIDR(annualTarget)}
- Target Net Profit Bulanan North Star (${monthLabel}): ${formatIDR(monthlyNorthStar)}
*Catatan Filosofi: Hanya ada SATU target finansial, yaitu North Star. Target masing-masing bisnis bukan nominal uang terpisah, melainkan kuota unit produk yang harus terjual untuk mewujudkan target bulanan ini.*

=======================================================
2. ALOKASI & TARGET PENJUALAN TIGA BISNIS
=======================================================
1. Jamu Herbal:
   - Alokasi Tanggung Jawab: ${jamuCalc.allocationPercentage}% dari North Star
   - Target Bulanan: ${jamuCalc.monthlySalesTarget} ${jamuCalc.salesUnit} / bulan
   - Kecepatan Harian: ${jamuCalc.dailySalesTarget} ${jamuCalc.salesUnit} / hari
   - Asumsi Profit per Unit: ${formatIDR(jamuCalc.profitPerUnit)}

2. Akademi Spiritual:
   - Alokasi Tanggung Jawab: ${spiritualCalc.allocationPercentage}% dari North Star
   - Target Bulanan: ${spiritualCalc.monthlySalesTarget} ${spiritualCalc.salesUnit} / bulan
   - Kecepatan Harian: ${spiritualCalc.dailySalesTarget} ${spiritualCalc.salesUnit} / hari
   - Asumsi Profit per Unit: ${formatIDR(spiritualCalc.profitPerUnit)}

3. Pakar Digital:
   - Alokasi Tanggung Jawab: ${pakarCalc.allocationPercentage}% dari North Star
   - Target Bulanan: ${pakarCalc.monthlySalesTarget} ${pakarCalc.salesUnit} / bulan
   - Kecepatan Harian: ${pakarCalc.dailySalesTarget} ${pakarCalc.salesUnit} / hari
   - Asumsi Profit per Unit: ${formatIDR(pakarCalc.profitPerUnit)}

=======================================================
3. REALISASI FINANSIAL & PENJUALAN UNIT (${monthLabel})
=======================================================
A. Realisasi Finansial Bersih (FinancialKu):
- Realisasi Net Profit: ${actualProfit !== null ? formatIDR(actualProfit) : 'Belum tercatat resmi'}
- Persentase Pencapaian vs North Star: ${achievementPct !== null ? formatPercent(achievementPct) : '-'}
- Selisih / Gap vs Target North Star: ${gap !== null ? (gap > 0 ? `Kekurangan ${formatIDR(gap)}` : `Surplus ${formatIDR(Math.abs(gap))}`) : '-'}

B. Realisasi Unit Terjual:
- Jamu Herbal: Terjual ${jamuSold} dari target ${jamuCalc.monthlySalesTarget} ${jamuCalc.salesUnit} (${jamuCalc.monthlySalesTarget > 0 ? Math.round((jamuSold / jamuCalc.monthlySalesTarget) * 100) : 0}%)
- Akademi Spiritual: Terjual ${spiritualSold} dari target ${spiritualCalc.monthlySalesTarget} ${spiritualCalc.salesUnit} (${spiritualCalc.monthlySalesTarget > 0 ? Math.round((spiritualSold / spiritualCalc.monthlySalesTarget) * 100) : 0}%)
- Pakar Digital: Terjual ${pakarSold} dari target ${pakarCalc.monthlySalesTarget} ${pakarCalc.salesUnit} (${pakarCalc.monthlySalesTarget > 0 ? Math.round((pakarSold / pakarCalc.monthlySalesTarget) * 100) : 0}%)

=======================================================
4. LEAD MEASURES & REFLEKSI DIRI
=======================================================
- Total Jam Kerja Produktif: ${hours} Jam
- Hari Kerja Konsisten (Rule of 3): ${consistentDays} Hari
- Total Outreach / Penawaran: ${outreach} Kontak
- Kemenangan & Pencapaian Utama (Wins):
  ${wins}
- Hambatan & Kendala Terbesar (Obstacles):
  ${obstacles}
- Pembelajaran Kunci (Lessons Learned):
  ${lessons}
- Rencana Penyesuaian Bulan Depan:
  ${adjustments}

=======================================================
5. PERTANYAAN & INSTRUKSI UNTUK COACH AI
=======================================================
Berdasarkan data lengkap di atas, tolong berikan analisis strategis:
1. Diagnosis Kecepatan (Run-rate): Apakah kecepatan unit penjualan dari ketiga bisnis saat ini realistis untuk mengejar kekurangan target North Star? Bisnis mana yang mengalami hambatan konversi terbesar?
2. Rekomendasi Lead Measures: Berikan masing-masing 2-3 tindakan Lead Measure prioritas tinggi yang spesifik untuk Jamu Herbal, Akademi Spiritual, dan Pakar Digital yang harus saya masukkan ke Execution Board minggu ini.
3. Evaluasi Alokasi: Apakah alokasi kontribusi saat ini (${jamuCalc.allocationPercentage}% / ${spiritualCalc.allocationPercentage}% / ${pakarCalc.allocationPercentage}%) sudah optimal atau perlu disesuaikan dengan kapasitas operasional saya?
4. Aturan Eksekusi Harian: Berikan nasihat disiplin untuk menjaga batas maksimal 3 tugas prioritas (Rule of 3) agar tidak burnout.`;
  };

  const promptText = generatePrompt();

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-7 max-w-5xl mx-auto pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E4575] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Cpu className="w-7 h-7 text-cyan-400" />
            <span>AI Coaching Prompt Generator V2</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Hasilkan prompt analisis terstruktur berdasarkan Single North Star, target unit 3 bisnis, dan realisasi FinancialKu.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0B2545] px-3.5 py-2 rounded-xl border border-[#1E4575] shadow-sm">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-mono"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#071B35] text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/20 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Prompt AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Info Card */}
      <div className="p-4 rounded-xl bg-[#0B2545]/70 border border-[#1E4575] text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Prompt ini diformulasikan khusus untuk model LLM (ChatGPT, Claude, atau Gemini). Prompt mengintegrasikan target nominal tunggal North Star, kuota penjualan produk tiga bisnis, realisasi Net Profit FinancialKu, dan refleksi bulanan untuk konsultasi strategi bisnis level eksekutif.
        </p>
      </div>

      {/* 3. Generated Prompt Box */}
      <div className="relative rounded-2xl bg-[#071B35] border border-[#1E4575] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#0B2545] border-b border-[#1E4575]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Format Prompt Terkompilasi ({formatMonthYearIndo(selectedMonth)})</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#15385F] hover:bg-[#1C4675] text-cyan-300 hover:text-white rounded-lg text-xs font-semibold transition border border-[#1E4575]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin'}</span>
          </button>
        </div>

        <pre className="p-6 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto selection:bg-cyan-500/30 selection:text-white">
          {promptText}
        </pre>
      </div>
    </div>
  );
};
