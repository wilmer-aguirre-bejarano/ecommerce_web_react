/**
 * Contexto de Autenticación
 * 
 * Gestiona sesión, usuario actual, perfil de vendedor y rol.
 * Usa Supabase Auth + consulta a tabla users para obtener rol.
 */
import { useCallback, createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Role, SellerProfile, User } from '../types/database';

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
  role: 'cliente' | 'vendedor';
  businessName?: string;
  phone?: string;
  address?: string;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  sellerProfile: SellerProfile | null;
  role: Role | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; role: Role | null }>;
  signUp: (
    input: SignUpInput,
  ) => Promise<{ error: string | null; role: Role | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<Role | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(
  nextSession: Session | null,
): Promise<{ user: User | null; sellerProfile: SellerProfile | null }> {
  const email = nextSession?.user?.email;
  if (!email) return { user: null, sellerProfile: null };

  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const profile = (data ?? null) as User | null;
    if (!profile) return { user: null, sellerProfile: null };

    if (profile.role === 'vendedor') {
      const { data: seller } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();
      return { user: profile, sellerProfile: (seller ?? null) as SellerProfile | null };
    }

    return { user: profile, sellerProfile: null };
  } catch {
    return { user: null, sellerProfile: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyProfile = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    return loadProfile(nextSession).then((result) => {
      setUser(result.user);
      setSellerProfile(result.sellerProfile);
      return result.user?.role ?? null;
    });
  }, []);

  const refresh = useCallback(
    () => applyProfile(session),
    [applyProfile, session],
  );

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      await applyProfile(data.session);
      if (active) setLoading(false);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      void applyProfile(nextSession).then(() => {
        if (active) setLoading(false);
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applyProfile]);

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message, role: null };
      const role = await applyProfile(data.session);
      return { error: null, role };
    },
    [applyProfile],
  );

  const signUp = useCallback<AuthContextValue['signUp']>(
    async (input) => {
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: { data: { name: input.name, role: input.role } },
      });
      if (error) return { error: error.message, role: null };

      const { error: insertError } = await supabase.from('users').insert({
        name: input.name,
        email: input.email,
        password: 'managed-by-supabase',
        role: input.role,
      });
      if (insertError) return { error: insertError.message, role: null };

      if (input.role === 'vendedor' && input.businessName) {
        const { data: created } = await supabase
          .from('users')
          .select('id')
          .eq('email', input.email)
          .maybeSingle();

        if (created) {
          const { error: sellerError } = await supabase
            .from('seller_profiles')
            .insert({
              user_id: created.id,
              business_name: input.businessName,
              phone: input.phone ?? null,
              address: input.address ?? null,
              qr_payload: `PAGO|${input.businessName}|${input.email}`,
            });
          if (sellerError) return { error: sellerError.message, role: null };
        }
      }

      const role = await applyProfile(data.session);
      return { error: null, role };
    },
    [applyProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setSellerProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      sellerProfile,
      role: user?.role ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [session, user, sellerProfile, loading, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
