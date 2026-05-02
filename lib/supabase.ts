/**
 * Supabase client — Phase 14.5 Step 2.
 *
 * Env-based credentials with safe fallback:
 * - If env vars are missing, client is created with placeholder URL/key.
 *   Auth and DB calls will fail, but the app does NOT crash.
 * - A single console.warn is emitted in dev so the issue is visible.
 *
 * Session persistence via AsyncStorage on native platforms.
 * Web platform uses default storage and detectSessionInUrl for OAuth.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (__DEV__) {
    console.warn(
      '[supabase] Missing env vars (EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY). ' +
        'Auth and DB calls will fail. App will still render.'
    );
  }
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      storage: Platform.OS === 'web' ? undefined : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);