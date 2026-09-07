// src/api/supabaseClient.js
// Supabase client with AsyncStorage for session persistence
// This keeps the user logged in when the app is closed

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL
  || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.SUPABASE_ANON_KEY
  || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing URL or ANON_KEY — check your .env file');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Persist session across app restarts
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Password-reset (and email-confirmation) links land back on the app
    // with the token in the URL — on web that's a real URL supabase-js can
    // read directly (window.location), so let it parse it and fire the
    // PASSWORD_RECOVERY auth event (see App.js). Native has no such URL to
    // read here; its recovery link instead comes in as a deep link,
    // handled separately via Linking in App.js.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
