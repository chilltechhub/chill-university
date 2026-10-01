// src/api/mfa.js
// Two-step sign-in with an authenticator app (TOTP), on Supabase Auth MFA.
//
// Flow: Settings → Two-step sign-in enrolls a factor (QR code + setup key),
// confirmed with one 6-digit code. After that, a password sign-in only
// reaches aal1; LoginScreen asks for a code and steps the session up to
// aal2 before the app opens (App.js sends an aal1 session back to Login on
// launch too).
//
// The database enforces it too (20260930120000_require_mfa_in_database.sql):
// a password-only session on an account with a verified factor is refused
// by every table and RPC. Before that it was app-only, so someone with just
// the password could skip the code by calling the API directly.
import { supabase } from './supabaseClient';
export { sessionNeedsSecondStep } from '../logic/mfaSession';

// True when this account has 2FA on and the current session hasn't done
// the code step yet.
export async function needsSecondStep() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
}

export async function verifiedTotpFactor() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return (data?.totp || []).find(f => f.status === 'verified') || null;
}

// The sign-in code step.
export async function verifySignInCode(code) {
  const factor = await verifiedTotpFactor();
  if (!factor) throw new Error('This account has no authenticator set up.');
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
  if (error) throw new Error(error.message?.includes('Invalid') ? 'That code didn’t match. Check the time on your phone and try the newest code.' : error.message);
}

// Setup: returns { factorId, qrSvg, secret }. Clears any half-finished
// (unverified) factor first so retrying setup doesn't pile them up.
export async function startSetup() {
  const { data: list } = await supabase.auth.mfa.listFactors();
  for (const f of (list?.all || []).filter(x => x.factor_type === 'totp' && x.status !== 'verified')) {
    await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `Deskartes ${Date.now()}` });
  if (error) throw error;
  // qr_code is an SVG data URI; the SVG text is what react-native-svg draws.
  const raw = data.totp.qr_code || '';
  const qrSvg = raw.startsWith('data:') ? decodeURIComponent(raw.slice(raw.indexOf(',') + 1)) : raw;
  return { factorId: data.id, qrSvg, secret: data.totp.secret };
}

export async function confirmSetup(factorId, code) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
  if (error) throw new Error(error.message?.includes('Invalid') ? 'That code didn’t match. Try the newest code from your app.' : error.message);
}

export async function turnOff(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
