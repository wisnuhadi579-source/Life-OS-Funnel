/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (mounted) {
        if (error) {
          console.error('Supabase getSession error:', error);
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    if (!configured) {
      const err = new Error('Konfigurasi Supabase belum lengkap. Masukkan URL dan Anon Key.') as unknown as AuthError;
      setAuthError(err.message);
      return { error: err };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Map standard supabase errors to helpful Indonesian messages
      if (error.message.includes('Invalid login credentials')) {
        setAuthError('Email atau kata sandi tidak cocok dengan akun terdaftar di FinancialKu.');
      } else if (error.message.includes('Email not confirmed')) {
        setAuthError('Email belum dikonfirmasi di Supabase.');
      } else {
        setAuthError(error.message);
      }
      return { error };
    }

    return { error: null };
  };

  const signOut = async () => {
    if (configured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: configured,
        signIn,
        signOut,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
