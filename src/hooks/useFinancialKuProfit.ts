/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UseFinancialKuProfitReturn {
  netProfit: number | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

export function useFinancialKuProfit(): UseFinancialKuProfitReturn {
  const { user } = useAuth();
  const [netProfit, setNetProfit] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNetProfit = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the authoritative RPC provided by the FinancialKu integration
      const { data, error: rpcError } = await supabase.rpc('life_os_get_profit_net');

      if (rpcError) {
        console.error('RPC life_os_get_profit_net error:', rpcError);
        setError('Data Net Profit FinancialKu belum dapat dimuat.');
        // NEVER silently replace a failed financial query with zero!
        setNetProfit(null);
      } else {
        // If data is returned (can be 0 or positive or negative)
        if (typeof data === 'number') {
          setNetProfit(data);
        } else if (data !== null && data !== undefined && !isNaN(Number(data))) {
          setNetProfit(Number(data));
        } else {
          setNetProfit(0);
        }
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Exception fetching Net Profit:', err);
      setError('Data Net Profit FinancialKu belum dapat dimuat.');
      setNetProfit(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNetProfit();
  }, [fetchNetProfit]);

  return {
    netProfit,
    loading,
    error,
    lastUpdated,
    refetch: fetchNetProfit,
  };
}
