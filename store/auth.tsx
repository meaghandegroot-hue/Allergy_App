// Sign-up / log-in with email and password (Supabase Auth).

import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Result = { error: string | null; needsConfirmation?: boolean };

type AuthContext = {
  /** False when Supabase keys aren't set — accounts aren't available. */
  available: boolean;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<Result>;
};

const Ctx = createContext<AuthContext | null>(null);

function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password don’t match an account.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first — check your inbox.';
  if (m.includes('already registered')) return 'There’s already an account with that email. Try logging in.';
  if (m.includes('password should be')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many tries. Please wait a few minutes and try again.';
  if (m.includes('network') || m.includes('fetch')) return 'Couldn’t connect. Check your internet and try again.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const value: AuthContext = {
    available: !!supabase,
    session,
    loading,
    async signUp(email, password) {
      if (!supabase) return { error: 'Accounts aren’t set up yet.' };
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) return { error: friendly(error.message) };
      // With email confirmation on, Supabase returns no session until the link is clicked.
      return { error: null, needsConfirmation: !data.session };
    },
    async signIn(email, password) {
      if (!supabase) return { error: 'Accounts aren’t set up yet.' };
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? friendly(error.message) : null };
    },
    async signOut() {
      await supabase?.auth.signOut();
    },
    async deleteAccount() {
      if (!supabase) return { error: 'Accounts aren’t set up yet.' };
      const { error } = await supabase.rpc('delete_my_account');
      if (error) return { error: friendly(error.message) };
      await supabase.auth.signOut();
      return { error: null };
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
