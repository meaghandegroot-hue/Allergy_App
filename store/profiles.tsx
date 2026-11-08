// Allergy profiles.
// Logged out: saved on this phone only.
// Logged in: also saved to the account (Supabase `diner_profiles`), so they follow the user.
// Profiles made before logging in are uploaded to the account on first log-in.

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/store/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

export type Profile = {
  id: string;
  name: string;
  /** Ids from data/allergens.ts */
  allergenIds: string[];
  /** Allergens the user typed in because they weren't on the list. */
  customAllergens: string[];
};

type State = {
  profiles: Profile[];
  /** Profiles currently eating together; their allergies are combined when searching. */
  diningIds: string[];
};

type ProfilesContext = State & {
  loaded: boolean;
  /** Set when saving to the account failed. */
  syncError: string | null;
  addProfile: (name: string) => Profile;
  updateProfile: (id: string, changes: Partial<Omit<Profile, 'id'>>) => void;
  deleteProfile: (id: string) => void;
  toggleDining: (id: string) => void;
};

type Row = {
  id: string;
  name: string;
  allergen_ids: string[];
  custom_allergens: string[];
  is_dining: boolean;
};

const STORAGE_KEY = 'allergy-app/profiles/v1';
/** Profiles made while logged out have ids starting with this; they aren't in any account yet. */
const LOCAL_PREFIX = 'local-';
const SAVE_ERROR = 'Couldn’t save to your account. Check your connection — changes are kept on this phone.';

const Ctx = createContext<ProfilesContext | null>(null);

function localId() {
  return `${LOCAL_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function toRow(p: Profile, dining: boolean): Row {
  return {
    id: p.id,
    name: p.name,
    allergen_ids: p.allergenIds,
    custom_allergens: p.customAllergens,
    is_dining: dining,
  };
}

function fromRow(r: Row): Profile {
  return {
    id: r.id,
    name: r.name,
    allergenIds: r.allergen_ids ?? [],
    customAllergens: r.custom_allergens ?? [],
  };
}

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const userId = session?.user.id ?? null;

  const [state, setState] = useState<State>({ profiles: [], diningIds: [] });
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const stateRef = useRef(state);
  const userRef = useRef<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load the copy saved on this phone.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Keep the phone copy up to date.
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  // Log-in / log-out.
  useEffect(() => {
    if (!loaded || authLoading) return;
    const previous = userRef.current;
    userRef.current = userId;

    if (previous && !userId) {
      // Logged out: don't leave someone's allergy details on a shared phone.
      setState({ profiles: [], diningIds: [] });
      setSyncError(null);
      return;
    }
    if (!userId || !supabase || previous === userId) return;

    const client = supabase;
    (async () => {
      // Upload profiles made before logging in.
      const local = stateRef.current;
      const unsynced = local.profiles.filter((p) => p.id.startsWith(LOCAL_PREFIX));
      if (unsynced.length) {
        const rows = unsynced.map((p) => toRow({ ...p, id: uuid() }, local.diningIds.includes(p.id)));
        const { error } = await client.from('diner_profiles').insert(rows);
        if (error) return setSyncError(SAVE_ERROR);
      }
      const { data, error } = await client
        .from('diner_profiles')
        .select('id, name, allergen_ids, custom_allergens, is_dining')
        .order('created_at');
      if (error || !data) return setSyncError(SAVE_ERROR);
      setSyncError(null);
      setState({
        profiles: (data as Row[]).map(fromRow),
        diningIds: (data as Row[]).filter((r) => r.is_dining).map((r) => r.id),
      });
    })();
  }, [userId, loaded, authLoading]);

  const inAccount = (id: string) => !!supabase && !!userRef.current && !id.startsWith(LOCAL_PREFIX);

  const report = (error: unknown) => setSyncError(error ? SAVE_ERROR : null);

  /** Save a profile to the account shortly after the last change (so typing a name isn't one save per letter). */
  const scheduleSave = (id: string) => {
    if (!inAccount(id)) return;
    clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const s = stateRef.current;
      const p = s.profiles.find((x) => x.id === id);
      if (!p || !supabase) return;
      const { id: _id, ...changes } = toRow(p, s.diningIds.includes(id));
      const { error } = await supabase.from('diner_profiles').update(changes).eq('id', id);
      report(error);
    }, 600);
  };

  const addProfile = (name: string) => {
    const signedIn = !!supabase && !!userRef.current;
    const profile: Profile = {
      id: signedIn ? uuid() : localId(),
      name,
      allergenIds: [],
      customAllergens: [],
    };
    // A new profile starts out "dining" so search reflects it right away.
    setState((s) => ({ profiles: [...s.profiles, profile], diningIds: [...s.diningIds, profile.id] }));
    if (signedIn && supabase) {
      supabase
        .from('diner_profiles')
        .insert(toRow(profile, true))
        .then(({ error }) => report(error));
    }
    return profile;
  };

  const updateProfile: ProfilesContext['updateProfile'] = (id, changes) => {
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    }));
    scheduleSave(id);
  };

  const deleteProfile = (id: string) => {
    clearTimeout(saveTimers.current[id]);
    setState((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      diningIds: s.diningIds.filter((d) => d !== id),
    }));
    if (inAccount(id) && supabase) {
      supabase
        .from('diner_profiles')
        .delete()
        .eq('id', id)
        .then(({ error }) => report(error));
    }
  };

  const toggleDining = (id: string) => {
    setState((s) => ({
      ...s,
      diningIds: s.diningIds.includes(id)
        ? s.diningIds.filter((d) => d !== id)
        : [...s.diningIds, id],
    }));
    scheduleSave(id);
  };

  return (
    <Ctx.Provider
      value={{
        ...state,
        loaded,
        syncError,
        addProfile,
        updateProfile,
        deleteProfile,
        toggleDining,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProfiles must be used inside ProfilesProvider');
  return ctx;
}

/** Combined allergies of everyone currently dining. */
export function useDiningAllergies() {
  const { profiles, diningIds } = useProfiles();
  const dining = profiles.filter((p) => diningIds.includes(p.id));
  const allergenIds = [...new Set(dining.flatMap((p) => p.allergenIds))];
  const customAllergens = [...new Set(dining.flatMap((p) => p.customAllergens))];
  return { dining, allergenIds, customAllergens };
}
