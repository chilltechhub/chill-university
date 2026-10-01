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

// Every request gives up after a while instead of waiting forever. fetch has
// no timeout of its own, so on a stalled connection (a lift, a bad café
// wifi, Apple's review network) a query could hang with its spinner up for
// good. A timed-out request fails like any network error: supabase-js hands
// back { error } (status 0), auth retries, and offline writes stay queued.
//
// Edge functions get longer (AI Import waits on a model), and so does
// Storage (file transfers). The clock runs until the response starts; a
// slow body after that isn't cut off.
//
// A timeout is final. postgrest-js retries a failed read up to 3 more times
// (1 s, 2 s, 4 s apart), which is right for a connection that drops
// instantly, but on a stalled one it meant four 20 s waits, about 87 s of
// spinner. It never retries an abort, so a timeout carries the abort code.
const TIMEOUT_MS = { rest: 20000, storage: 60000, functions: 90000 };

function timeoutFor(input) {
  const url = typeof input === 'string' ? input : input?.url || '';
  if (url.includes('/functions/v1/')) return TIMEOUT_MS.functions;
  if (url.includes('/storage/v1/')) return TIMEOUT_MS.storage;
  return TIMEOUT_MS.rest;
}

export function fetchWithTimeout(input, init = {}) {
  const ms = timeoutFor(input);
  const controller = new AbortController();
  // A caller's own abort (supabase-js .abortSignal()) still works.
  const outer = init.signal;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener?.('abort', onOuterAbort);
  }
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, ms);
  // fetch is looked up per call, not captured, so a test that wraps
  // window.fetch (to fake being offline) still goes through here.
  return fetch(input, { ...init, signal: controller.signal })
    .catch((e) => {
      if (!timedOut) throw e;
      const err = new Error(`Request timed out after ${ms / 1000}s`);
      err.name = 'TimeoutError';
      err.code = 'ABORT_ERR';
      throw err;
    })
    .finally(() => {
      clearTimeout(timer);
      outer?.removeEventListener?.('abort', onOuterAbort);
    });
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { fetch: fetchWithTimeout },
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
