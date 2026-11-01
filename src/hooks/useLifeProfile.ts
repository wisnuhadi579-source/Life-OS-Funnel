/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LifeProfile } from '../types/database';

export function useLifeProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LifeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('life_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching life_profiles:', error);
        setError(error.message);
      } else if (data) {
        setProfile(data as LifeProfile);
      } else {
        // Automatically ensure initial profile row exists for this authenticated user
        const initialProfile: Partial<LifeProfile> = {
          user_id: user.id,
          display_name: user.email ? user.email.split('@')[0] : 'Pengguna Life OS',
          business_name: 'Bisnis Saya',
          average_package_price: 15000000,
          expected_net_margin_pct: 35,
          working_days_per_week: 5,
          daily_outreach_target: 10,
          planning_start_date: new Date().toISOString().split('T')[0],
        };

        const { data: inserted, error: insertError } = await supabase
          .from('life_profiles')
          .insert([initialProfile])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating initial life_profiles row:', insertError);
          // Fall back to local object for UI rendering if RLS restricts without trigger
          setProfile({ id: user.id, ...initialProfile } as LifeProfile);
        } else {
          setProfile(inserted as LifeProfile);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat profil pengguna.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<LifeProfile>): Promise<{ success: boolean; error: string | null }> => {
    if (!user || !isSupabaseConfigured()) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    try {
      setError(null);
      const payload = {
        ...updates,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      const { data, error: updateErr } = await supabase
        .from('life_profiles')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single();

      if (updateErr) {
        console.error('Error updating life_profile:', updateErr);
        return { success: false, error: updateErr.message };
      }

      setProfile(data as LifeProfile);
      return { success: true, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      return { success: false, error: msg };
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
}
