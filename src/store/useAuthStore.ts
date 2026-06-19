import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import i18n from '@/i18n';

export type CustomerProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: 'customer' | 'admin' | 'installer';
  created_at: string;
};

type SignupInput = {
  full_name: string;
  phone: string;
  city: string;
  email: string;
  password: string;
};

type ProfileUpdateInput = {
  full_name: string;
  phone: string;
  city: string;
};

type AuthState = {
  session: Session | null;
  profile: CustomerProfile | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<CustomerProfile | null>;
  updateProfile: (input: ProfileUpdateInput) => Promise<CustomerProfile>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignupInput) => Promise<{ needsEmailConfirmation: boolean }>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

let subscribed = false;

const requireSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error(i18n.t('errors.supabaseMissing'));
  }
};

const fetchCustomerProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, city, role, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(i18n.t('errors.profilePreparing'));
  if (data.role !== 'customer') throw new Error(i18n.t('errors.customerOnly'));
  return data as CustomerProfile;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,
  loading: false,
  error: null,
  initialize: async () => {
    if (get().initialized) return;
    requireSupabase();
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const session = data.session;
      set({ session });
      if (session) {
        try {
          set({ profile: await fetchCustomerProfile(session.user.id) });
        } catch (reason) {
          await supabase.auth.signOut();
          set({ session: null, profile: null, error: reason instanceof Error ? reason.message : i18n.t('errors.loadProfile') });
        }
      }

      if (!subscribed) {
        subscribed = true;
        supabase.auth.onAuthStateChange((_event, nextSession) => {
          set({ session: nextSession, profile: nextSession ? get().profile : null });
          if (nextSession) {
            setTimeout(() => {
              void get().refreshProfile(nextSession.user.id);
            }, 0);
          }
        });
      }
    } catch (reason) {
      set({ error: reason instanceof Error ? reason.message : i18n.t('errors.restoreSession') });
    } finally {
      set({ initialized: true, loading: false });
    }
  },
  refreshProfile: async (userId) => {
    const id = userId ?? get().session?.user.id;
    if (!id) return null;
    try {
      const profile = await fetchCustomerProfile(id);
      set({ profile, error: null });
      return profile;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : i18n.t('errors.loadProfile');
      if (message === i18n.t('errors.customerOnly')) {
        await supabase.auth.signOut();
        set({ session: null, profile: null });
      }
      set({ error: message });
      return null;
    }
  },
  updateProfile: async ({ full_name, phone, city }) => {
    requireSupabase();
    const userId = get().session?.user.id;
    if (!userId) throw new Error(i18n.t('errors.loginRequired'));

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          phone: phone.trim(),
          city: city.trim()
        })
        .eq('id', userId)
        .select('id, full_name, phone, city, role, created_at')
        .single();
      if (error) throw error;
      const profile = data as CustomerProfile;
      set({ profile, error: null });
      return profile;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : i18n.t('profile.updateFailed');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },
  signIn: async (email, password) => {
    requireSupabase();
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const profile = await fetchCustomerProfile(data.user.id);
      set({ session: data.session, profile });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : i18n.t('errors.loginFailed');
      await supabase.auth.signOut();
      set({ session: null, profile: null, error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },
  signUp: async ({ full_name, phone, city, email, password }) => {
    requireSupabase();
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: full_name.trim(), phone: phone.trim(), city: city.trim() } }
      });
      if (error) throw error;
      if (data.session) {
        const profile = await fetchCustomerProfile(data.user!.id);
        set({ session: data.session, profile });
      }
      return { needsEmailConfirmation: !data.session };
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : i18n.t('auth.signup.unable');
      await supabase.auth.signOut();
      set({ session: null, profile: null });
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },
  requestPasswordReset: async (email) => {
    requireSupabase();
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : i18n.t('auth.forgot.unable');
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      set({ session: null, profile: null, loading: false });
    }
  },
  clearError: () => set({ error: null })
}));
