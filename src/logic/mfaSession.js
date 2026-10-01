// src/logic/mfaSession.js
// "Has this session done its two-step code yet?", answered from the session
// object alone.
//
// src/api/mfa.js's needsSecondStep() asks supabase-js, which is fine almost
// everywhere, but not inside onAuthStateChange: supabase-js runs listeners
// while holding its auth lock, and asking it anything from there waits on
// that same lock (the cold-start deadlock found 2026-09-27). This works it
// out the way supabase-js does internally: the account has a verified
// factor (session.user.factors) and the access token's `aal` claim isn't
// 'aal2' yet.
//
// No imports on purpose, so the offline queue can use it without pulling in
// the Supabase client.

function jwtClaim(token, key) {
  const part = String(token || '').split('.')[1];
  if (!part) throw new Error('not a JWT');
  let b64 = part.replace(/-/g, '+').replace(/_/g, '/');
  b64 += '='.repeat((4 - (b64.length % 4)) % 4);
  // atob gives bytes; the percent round-trip turns UTF-8 bytes (a name in
  // user_metadata) back into text.
  const text = decodeURIComponent(
    Array.from(atob(b64), ch => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0')).join('')
  );
  return JSON.parse(text)[key];
}

export function sessionNeedsSecondStep(session) {
  const factors = session?.user?.factors || [];
  if (!factors.some(f => f.status === 'verified')) return false;
  try {
    return jwtClaim(session.access_token, 'aal') !== 'aal2';
  } catch {
    // Can't read the token: don't lock the person out on the app side. The
    // database still refuses a password-only session
    // (20260930120000_require_mfa_in_database.sql).
    return false;
  }
}
