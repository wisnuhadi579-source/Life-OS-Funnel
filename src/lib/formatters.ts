/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Format number to Indonesian Rupiah (IDR)
 * Example: 15000000 -> "Rp 15.000.000"
 */
export function formatIDR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Compact Indonesian Rupiah format
 * Example: 15000000 -> "Rp 15 Jt", 1500000000 -> "Rp 1,5 M"
 */
export function formatCompactIDR(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Rp 0';
  }
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}Rp ${(abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Jt`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${(abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 })} Rb`;
  }
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`;
}

/**
 * Format percentage
 * Example: 85.42 -> "85,4%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }
  return `${value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

/**
 * Format full Indonesian date
 * Example: "2026-10-29" -> "29 Oktober 2026"
 */
export function formatDateIndo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format Month & Year in Indonesian
 * Example: "2026-10-01" -> "Oktober 2026"
 */
export function formatMonthYearIndo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '-';
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get the current month start date in YYYY-MM-01 format
 */
export function getCurrentMonthStart(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Generate 24-month selectable list (12 past months, current month, 11 future months)
 */
export function getAvailableMonthOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  // Range from 12 months ago to 6 months ahead
  for (let i = -12; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}-01`;
    const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }

  return options;
}
