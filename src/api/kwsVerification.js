// src/api/kwsVerification.js
//
// Thin client for the parent-verification gate in Onboarding — calls our
// own kws-verify Edge Function (never Kids Web Services directly; see
// that function's header comment for why) and reads back the status the
// kws-webhook function writes onto the caller's own `profiles` row.

import Constants from 'expo-constants';
import { supabase } from './supabaseClient';

const SUPABASE_URL = Constants.expoConfig?.extra?.SUPABASE_URL
  || process.env.EXPO_PUBLIC_SUPABASE_URL;

// Kicks off KWS Parent Verification: emails the parent/guardian a
// verification link. Resolves once KWS has accepted the request — this
// does NOT mean the parent has verified yet, only that the email is on
// its way. Poll getVerificationStatus() (or re-fetch the profile) for
// the outcome.
export async function startParentVerification({ parentEmail, countryCode, language }) {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error('Not signed in.');

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/kws-verify`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      parentEmail,
      location: countryCode || 'US',
      language: language || 'en',
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || `Request failed (${resp.status})`);
  return data; // { ok: true, status: 'pending' }
}

// Re-reads this user's own verification status straight from `profiles`
// — cheap enough to call on a pull-to-refresh or a timed poll while the
// onboarding flow shows its "waiting on your parent" screen.
export async function getVerificationStatus(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('kws_pv_status, kws_verified_at, parent_email')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
