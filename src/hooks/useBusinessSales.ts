/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LifeBusinessSale } from '../types/database';

export function useBusinessSales(selectedDateStr?: string) {
  const { user } = useAuth();
  const [todaySales, setTodaySales] = useState<Record<string, LifeBusinessSale>>({});
  const [monthlyTotals, setMonthlyTotals] = useState<Record<string, number>>({});
  const [monthRecords, setMonthRecords] = useState<LifeBusinessSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default to today YYYY-MM-DD
  const targetDate = selectedDateStr || new Date().toISOString().split('T')[0];
  const [year, month] = targetDate.split('-');
  const monthStart = `${year}-${month}-01`;
  // calculate last day of month
  const lastDayOfMonth = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate();
  const monthEnd = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const fetchSalesData = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all sales for this month
      const { data, error: fetchErr } = await supabase
        .from('life_business_sales')
        .select('*')
        .eq('user_id', user.id)
        .gte('sales_date', monthStart)
        .lte('sales_date', monthEnd)
        .order('sales_date', { ascending: true });

      if (fetchErr) {
        // If table doesn't exist yet or other query error
        console.warn('Warning fetching life_business_sales:', fetchErr.message);
        setError(fetchErr.message);
        return;
      }

      const records = (data || []) as LifeBusinessSale[];
      setMonthRecords(records);

      // Group totals for this month
      const totals: Record<string, number> = {
        jamu_herbal: 0,
        akademi_spiritual: 0,
        pakar_digital: 0,
      };

      const dayMap: Record<string, LifeBusinessSale> = {};

      records.forEach((rec) => {
        totals[rec.business_key] = (totals[rec.business_key] || 0) + (Number(rec.units_sold) || 0);
        if (rec.sales_date === targetDate) {
          dayMap[rec.business_key] = rec;
        }
      });

      setMonthlyTotals(totals);
      setTodaySales(dayMap);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data penjualan harian.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, monthStart, monthEnd, targetDate]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const recordDailySale = async (
    businessKey: string,
    unitsSold: number,
    notes?: string,
    salesUnit?: string,
    profitPerUnit?: number,
    customDate?: string
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };
    const dateToRecord = customDate || targetDate;

    try {
      const payload: Partial<LifeBusinessSale> = {
        user_id: user.id,
        business_key: businessKey,
        sales_date: dateToRecord,
        units_sold: Math.max(0, unitsSold),
        notes: notes || '',
        updated_at: new Date().toISOString(),
      };

      if (salesUnit) payload.sales_unit_snapshot = salesUnit;
      if (profitPerUnit) payload.profit_per_unit_snapshot = profitPerUnit;

      const { data, error: upsertErr } = await supabase
        .from('life_business_sales')
        .upsert(payload, { onConflict: 'user_id,business_key,sales_date' })
        .select()
        .single();

      if (upsertErr) {
        console.error('Error recording daily sale:', upsertErr);
        return { success: false, error: upsertErr.message };
      }

      // Refresh state
      await fetchSalesData();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan penjualan.';
      return { success: false, error: msg };
    }
  };

  return {
    todaySales,
    monthlyTotals,
    monthRecords,
    loading,
    error,
    refreshSales: fetchSalesData,
    recordDailySale,
    targetDate,
    monthStart,
  };
}
