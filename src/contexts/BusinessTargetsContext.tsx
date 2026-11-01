/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { LifeBusinessTarget } from '../types/database';

export const ALLOWED_BUSINESS_KEYS = ['jamu_herbal', 'akademi_spiritual', 'pakar_digital'] as const;

/**
 * 3 Target Aktif Life OS Funnel V2:
 * 1. Jamu Herbal (10% alokasi, Rp10.000 profit/unit, botol 500 ml, 30 hari)
 * 2. Akademi Spiritual (50% alokasi, Rp10.000 profit/unit, member, 30 hari)
 * 3. Pakar Digital (40% alokasi, Rp50.000 profit/unit, produk, 30 hari)
 */
export const INITIAL_BUSINESS_TARGETS: Omit<LifeBusinessTarget, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
  {
    business_key: 'jamu_herbal',
    business_name: 'Jamu Herbal',
    income_stream_name: 'Jamu Herbal',
    allocation_percentage: 10,
    profit_per_unit: 10000,
    sales_unit: 'botol 500 ml',
    planning_days_per_month: 30,
    sort_order: 1,
    is_active: true,
  },
  {
    business_key: 'akademi_spiritual',
    business_name: 'Akademi Spiritual',
    income_stream_name: 'Akademi Spiritual',
    allocation_percentage: 50,
    profit_per_unit: 10000,
    sales_unit: 'member',
    planning_days_per_month: 30,
    sort_order: 2,
    is_active: true,
  },
  {
    business_key: 'pakar_digital',
    business_name: 'Pakar Digital',
    income_stream_name: 'Pakar Digital',
    allocation_percentage: 40,
    profit_per_unit: 50000,
    sales_unit: 'produk',
    planning_days_per_month: 30,
    sort_order: 3,
    is_active: true,
  },
];

export interface BusinessSummary {
  businessKey: string;
  businessName: string;
  targets: LifeBusinessTarget[];
  dailySubtotal: number;
  monthlySubtotal: number;
  activeCount: number;
  totalCount: number;
}

export interface BusinessTargetsContextType {
  targets: LifeBusinessTarget[];
  activeTargets: LifeBusinessTarget[];
  businessSummaries: BusinessSummary[];
  totalDailyTarget: number;
  totalMonthlyTarget: number;
  activeBusinessesCount: number;
  activeIncomeStreamsCount: number;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  initializeDefaultTargets: () => Promise<{ success: boolean; count: number; error: string | null }>;
  createTarget: (
    targetData: Omit<LifeBusinessTarget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<{ success: boolean; error: string | null }>;
  updateTarget: (
    id: string,
    updates: Partial<Omit<LifeBusinessTarget, 'id' | 'user_id'>>
  ) => Promise<{ success: boolean; error: string | null }>;
  deleteTarget: (id: string) => Promise<{ success: boolean; error: string | null }>;
  toggleTargetActive: (id: string, currentStatus: boolean) => Promise<{ success: boolean; error: string | null }>;
  checkDuplicateName: (businessKey: string, incomeStreamName: string, excludeId?: string) => boolean;
  updateAllocations: (
    allocations: { business_key: string; allocation_percentage: number }[]
  ) => Promise<{ success: boolean; error: string | null }>;
}

const BusinessTargetsContext = createContext<BusinessTargetsContextType | undefined>(undefined);

export const BusinessTargetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [allRawTargets, setAllRawTargets] = useState<LifeBusinessTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializingRef = useRef(false);

  const fetchTargets = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Query public.life_business_targets for the active user
      const { data, error: fetchErr } = await supabase
        .from('life_business_targets')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (fetchErr) {
        console.error('Error fetching life_business_targets:', fetchErr);
        setError(fetchErr.message);
      } else {
        setAllRawTargets((data || []) as LifeBusinessTarget[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat target bisnis.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // FILTER WAJIB:
  // 1. user_id = pengguna aktif (sudah dijamin via .eq('user_id', user.id))
  // 2. is_active = true
  // 3. business_key sesuai tiga bisnis yang sudah ditentukan ('jamu_herbal', 'akademi_spiritual', 'pakar_digital')
  // JANGAN tampilkan 7 data target lama yang berstatus nonaktif!
  const activeTargets = allRawTargets.filter(
    (t) => t.is_active === true && (ALLOWED_BUSINESS_KEYS as readonly string[]).includes(t.business_key)
  );

  // Targets exposed to the rest of the application should only be the valid active targets
  const targets = activeTargets;

  // Duplicate name check within the same business (case-insensitive)
  const checkDuplicateName = useCallback(
    (businessKey: string, incomeStreamName: string, excludeId?: string): boolean => {
      const normalized = incomeStreamName.trim().toLowerCase();
      return targets.some(
        (t) =>
          t.business_key === businessKey &&
          t.id !== excludeId &&
          (t.income_stream_name || t.business_name || '').trim().toLowerCase() === normalized
      );
    },
    [targets]
  );

  // Initialization safeguard:
  // JANGAN membuat data target baru jika 3 target aktif tersebut sudah tersedia!
  const initializeDefaultTargets = async (): Promise<{ success: boolean; count: number; error: string | null }> => {
    if (!user) return { success: false, count: 0, error: 'Pengguna belum terautentikasi.' };

    if (isInitializingRef.current) {
      return { success: false, count: 0, error: 'Inisialisasi sedang berlangsung.' };
    }

    isInitializingRef.current = true;
    setInitializing(true);
    setError(null);

    try {
      const { data: existing, error: checkErr } = await supabase
        .from('life_business_targets')
        .select('*')
        .eq('user_id', user.id);

      if (checkErr) {
        throw checkErr;
      }

      // Check if 3 active targets already exist for the allowed business keys
      const existingList = (existing || []) as LifeBusinessTarget[];
      const activeExisting = existingList.filter(
        (t) => t.is_active === true && (ALLOWED_BUSINESS_KEYS as readonly string[]).includes(t.business_key)
      );

      if (activeExisting.length >= 3) {
        // Active targets are already present in database! Do not create duplicate rows.
        await fetchTargets();
        return { success: true, count: activeExisting.length, error: null };
      }

      // If active targets missing for any of the 3 keys, only insert the missing ones
      const missingPayload = INITIAL_BUSINESS_TARGETS.filter(
        (init) => !activeExisting.some((ex) => ex.business_key === init.business_key)
      ).map((t) => ({
        ...t,
        user_id: user.id,
      }));

      if (missingPayload.length === 0) {
        await fetchTargets();
        return { success: true, count: activeExisting.length, error: null };
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('life_business_targets')
        .insert(missingPayload)
        .select();

      if (insertErr) {
        console.error('Error inserting initial business targets:', insertErr);
        return { success: false, count: 0, error: insertErr.message };
      }

      await fetchTargets();
      return { success: true, count: (inserted || []).length, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menginisialisasi target.';
      setError(msg);
      return { success: false, count: 0, error: msg };
    } finally {
      isInitializingRef.current = false;
      setInitializing(false);
    }
  };

  const createTarget = async (
    targetData: Omit<LifeBusinessTarget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const streamName = targetData.income_stream_name || targetData.business_name || '';
    if (checkDuplicateName(targetData.business_key, streamName)) {
      return {
        success: false,
        error: `Nama sumber pendapatan "${streamName}" sudah terdaftar pada bisnis ini.`,
      };
    }

    try {
      setError(null);
      const payload = {
        ...targetData,
        user_id: user.id,
        sort_order: targetData.sort_order ?? targets.length + 1,
      };

      const { data, error: insertErr } = await supabase
        .from('life_business_targets')
        .insert([payload])
        .select()
        .single();

      if (insertErr) {
        console.error('Error creating business target:', insertErr);
        return { success: false, error: insertErr.message };
      }

      const newRecord = data as LifeBusinessTarget;
      setAllRawTargets((prev) => [...prev, newRecord]);
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menambahkan target bisnis.';
      return { success: false, error: msg };
    }
  };

  const updateTarget = async (
    id: string,
    updates: Partial<Omit<LifeBusinessTarget, 'id' | 'user_id'>>
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const currentTarget = allRawTargets.find((t) => t.id === id);
    const targetBusinessKey = updates.business_key || currentTarget?.business_key;
    const targetStreamName = updates.income_stream_name || currentTarget?.income_stream_name;

    if (targetBusinessKey && targetStreamName) {
      if (checkDuplicateName(targetBusinessKey, targetStreamName, id)) {
        return {
          success: false,
          error: `Nama sumber pendapatan "${targetStreamName}" sudah terdaftar pada bisnis ini.`,
        };
      }
    }

    try {
      setError(null);
      const { data, error: updateErr } = await supabase
        .from('life_business_targets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Error updating business target:', updateErr);
        return { success: false, error: updateErr.message };
      }

      const updatedRecord = data as LifeBusinessTarget;
      setAllRawTargets((prev) => prev.map((t) => (t.id === id ? updatedRecord : t)));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui target.';
      return { success: false, error: msg };
    }
  };

  const deleteTarget = async (id: string): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    try {
      setError(null);
      const { error: delErr } = await supabase
        .from('life_business_targets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (delErr) {
        console.error('Error deleting business target:', delErr);
        return { success: false, error: delErr.message };
      }

      setAllRawTargets((prev) => prev.filter((t) => t.id !== id));
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus target.';
      return { success: false, error: msg };
    }
  };

  const toggleTargetActive = async (
    id: string,
    currentStatus: boolean
  ): Promise<{ success: boolean; error: string | null }> => {
    return updateTarget(id, { is_active: !currentStatus });
  };

  const updateAllocations = async (
    allocations: { business_key: string; allocation_percentage: number }[]
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!user) return { success: false, error: 'Pengguna belum terautentikasi.' };

    const total = allocations.reduce((sum, item) => sum + Number(item.allocation_percentage || 0), 0);
    if (total !== 100) {
      return {
        success: false,
        error: `Total alokasi harus tepat 100%. Total saat ini: ${total}%.`,
      };
    }

    try {
      setError(null);
      // Attempt RPC first
      const { error: rpcErr } = await supabase.rpc('life_os_update_business_allocations', {
        p_allocations: allocations,
      });

      if (!rpcErr) {
        await fetchTargets();
        return { success: true, error: null };
      }

      console.warn('RPC life_os_update_business_allocations failed, falling back to direct update:', rpcErr.message);

      // Fallback: update each target row
      for (const alloc of allocations) {
        await supabase
          .from('life_business_targets')
          .update({
            allocation_percentage: alloc.allocation_percentage,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('business_key', alloc.business_key)
          .eq('is_active', true);
      }

      await fetchTargets();
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui alokasi.';
      return { success: false, error: msg };
    }
  };

  // Group active targets by the 3 specified businesses
  const businessSummaries: BusinessSummary[] = [];

  ALLOWED_BUSINESS_KEYS.forEach((key) => {
    const bTargets = targets.filter((t) => t.business_key === key);
    const defaultName =
      key === 'jamu_herbal'
        ? 'Jamu Herbal'
        : key === 'akademi_spiritual'
        ? 'Akademi Spiritual'
        : 'Pakar Digital';
    const bName = bTargets[0]?.business_name || defaultName;

    const dailySubtotal = bTargets.reduce(
      (sum, t) => sum + Number(t.daily_net_profit_target || 0),
      0
    );
    const monthlySubtotal = bTargets.reduce(
      (sum, t) => sum + Number(t.monthly_net_profit_target || 0),
      0
    );

    businessSummaries.push({
      businessKey: key,
      businessName: bName,
      targets: bTargets,
      dailySubtotal,
      monthlySubtotal,
      activeCount: bTargets.length,
      totalCount: bTargets.length,
    });
  });

  const totalDailyTarget = targets.reduce(
    (sum, t) => sum + Number(t.daily_net_profit_target || 0),
    0
  );
  const totalMonthlyTarget = targets.reduce(
    (sum, t) => sum + Number(t.monthly_net_profit_target || 0),
    0
  );

  const activeBusinessesCount = businessSummaries.filter((b) => b.activeCount > 0).length;

  return (
    <BusinessTargetsContext.Provider
      value={{
        targets,
        activeTargets,
        businessSummaries,
        totalDailyTarget,
        totalMonthlyTarget,
        activeBusinessesCount,
        activeIncomeStreamsCount: targets.length,
        loading,
        initializing,
        error,
        refetch: fetchTargets,
        initializeDefaultTargets,
        createTarget,
        updateTarget,
        deleteTarget,
        toggleTargetActive,
        checkDuplicateName,
        updateAllocations,
      }}
    >
      {children}
    </BusinessTargetsContext.Provider>
  );
};

export const useBusinessTargets = (): BusinessTargetsContextType => {
  const context = useContext(BusinessTargetsContext);
  if (!context) {
    throw new Error('useBusinessTargets must be used within a BusinessTargetsProvider');
  }
  return context;
};
