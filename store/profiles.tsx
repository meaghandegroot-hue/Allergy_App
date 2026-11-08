// Allergy profiles, saved on this phone for now.
// Phase 2 moves these into the user's account on the backend.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
  addProfile: (name: string) => Profile;
  updateProfile: (id: string, changes: Partial<Omit<Profile, 'id'>>) => void;
  deleteProfile: (id: string) => void;
  toggleDining: (id: string) => void;
};

const STORAGE_KEY = 'allergy-app/profiles/v1';
const Ctx = createContext<ProfilesContext | null>(null);

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ profiles: [], diningIds: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setState(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const addProfile = (name: string) => {
    const profile: Profile = { id: newId(), name, allergenIds: [], customAllergens: [] };
    // A new profile starts out "dining" so search reflects it right away.
    setState((s) => ({ profiles: [...s.profiles, profile], diningIds: [...s.diningIds, profile.id] }));
    return profile;
  };

  const updateProfile: ProfilesContext['updateProfile'] = (id, changes) =>
    setState((s) => ({
      ...s,
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    }));

  const deleteProfile = (id: string) =>
    setState((s) => ({
      profiles: s.profiles.filter((p) => p.id !== id),
      diningIds: s.diningIds.filter((d) => d !== id),
    }));

  const toggleDining = (id: string) =>
    setState((s) => ({
      ...s,
      diningIds: s.diningIds.includes(id)
        ? s.diningIds.filter((d) => d !== id)
        : [...s.diningIds, id],
    }));

  return (
    <Ctx.Provider
      value={{ ...state, loaded, addProfile, updateProfile, deleteProfile, toggleDining }}
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
