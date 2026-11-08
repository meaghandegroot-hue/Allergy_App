// Supabase connection. Fill in .env.local (see supabase/README.md).
// If the keys aren't set, `supabase` is null and the app uses the sample data in data/.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// During the web build there is no window, so don't touch storage there.
const canStore = Platform.OS !== 'web' || typeof window !== 'undefined';

export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: canStore ? AsyncStorage : undefined,
          autoRefreshToken: true,
          persistSession: canStore,
          detectSessionInUrl: false,
        },
      })
    : null;

export const isBackendConfigured = supabase !== null;

// On phones, only refresh the login session while the app is open.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
