// supabase/functions/kws-verify/index.ts
//
// Server-side proxy to Kids Web Services' Parent Verification (PV) API.
//
// Same reason this exists as parse-import/index.ts: a React Native/Expo
// client ships as a downloadable bundle, so any secret referenced in
// client code (including EXPO_PUBLIC_* env vars) is readable by anyone
// who unpacks the app. KWS's own docs are explicit about this too —
// "Keep these credentials and tokens confidential. Do not pass them to
// client apps." This function holds the KWS client secret ("API key")
// as a Supabase Edge Function secret and the app calls this function
// instead of KWS directly.
//
// What this does NOT do: KWS's Parent Verification Service only confirms
// the parent/guardian is an adult — per Epic's own docs it "has not been
// designed to obtain consent... or to address direct notice requirements
// when required by applicable law (such as COPPA)". So once this reports
// kws_pv_status = 'verified' (via the kws-webhook function), the app
// still shows its own in-app consent screen before treating the account
// as fully set up — see src/screens/Onboarding.js.
//
// Deploy:
//   supabase functions deploy kws-verify
//   supabase secrets set KWS_ORG_ID=... KWS_CLIENT_ID=... KWS_API_KEY=... KWS_PV_API_BASE=...
//
// KWS_PV_API_BASE is the "Service API host URL" shown on the Parent
// Verification page's Integration Information tab in the KWS Developer
// Portal — it's account-specific, there's no public constant for it.
// SEND_EMAIL_PATH below is confirmed against this org's own KWS Managed
// Verification API spec (same Integration Information tab → API
// Reference → API Specification) and tested live with a real token —
// if you're pointing this at a different org, double-check it still
// matches theirs.
//
// Requires the caller to be authenticated — Supabase's function gateway
// checks the JWT before this code runs (deploy without --no-verify-jwt).

const KWS_ORG_ID = Deno.env.get('KWS_ORG_ID');
const KWS_CLIENT_ID = Deno.env.get('KWS_CLIENT_ID');
const KWS_API_KEY = Deno.env.get('KWS_API_KEY'); // the KWS "API key" = OAuth client secret
const KWS_PV_API_BASE = Deno.env.get('KWS_PV_API_BASE'); // e.g. https://pv-api.kidswebservices.com — from the Integration Information tab
const KWS_AUTH_URL = 'https://auth.kidswebservices.com/auth/realms/kws/protocol/openid-connect/token';
// Confirmed against the org's own KWS Managed Verification API spec
// (Developer Portal → Parent Verification → API Reference → API
// Specification) and verified live with a real token — not a guess.
const SEND_EMAIL_PATH = '/v1/verifications/send-email';

// Supabase auto-injects these into every Edge Function's environment —
// nothing to set with `supabase secrets set` for these two.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function cors(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

async function getDeveloperAccessToken(): Promise<string> {
  const basic = btoa(`${KWS_CLIENT_ID}:${KWS_API_KEY}`);
  const resp = await fetch(KWS_AUTH_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${basic}`,
    },
    body: 'grant_type=client_credentials&scope=verification',
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`KWS auth failed (${resp.status}): ${detail}`);
  }
  const data = await resp.json();
  return data.access_token as string;
}

// Who is making this request? We trust the JWT Supabase's gateway already
// validated, then look the user up ourselves with the service role key
// (the anon key + Authorization header the client sent would also work
// via a scoped client, but we need service role anyway to write the
// pending status below, so just do the one auth.getUser call with it).
async function getCallingUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      authorization: `Bearer ${jwt}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.id || null;
}

async function markPending(uid: string, parentEmail: string) {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY as string,
        prefer: 'return=minimal',
      },
      body: JSON.stringify({ parent_email: parentEmail, kws_pv_status: 'pending' }),
    },
  );
  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(`Failed to mark profile pending (${resp.status}): ${detail}`);
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors(200, {});
  if (req.method !== 'POST') return cors(405, { error: 'Method not allowed' });

  if (!KWS_ORG_ID || !KWS_CLIENT_ID || !KWS_API_KEY || !KWS_PV_API_BASE) {
    console.error('kws-verify: missing one or more KWS_* secrets');
    return cors(500, { error: 'Parent verification isn’t configured yet — ask the app owner to set the KWS secrets.' });
  }

  const uid = await getCallingUserId(req);
  if (!uid) return cors(401, { error: 'Not signed in.' });

  let body: { parentEmail?: string; location?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return cors(400, { error: 'Invalid request body' });
  }

  const parentEmail = (body.parentEmail || '').trim();
  const location = (body.location || 'US').trim();
  const language = (body.language || 'en').trim();

  if (!EMAIL_RE.test(parentEmail)) {
    return cors(400, { error: 'Enter a valid parent/guardian email address.' });
  }

  try {
    const token = await getDeveloperAccessToken();

    const resp = await fetch(`${KWS_PV_API_BASE}${SEND_EMAIL_PATH}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'user-agent': 'chill-app/kws-verify',
      },
      body: JSON.stringify({
        orgId: KWS_ORG_ID,
        email: parentEmail,
        location,
        language,
        userContext: 'parent',
        // Round-tripped back to us verbatim in the kws-webhook payload —
        // this is how we know which profile row to update.
        externalPayload: uid,
      }),
    });

    if (!resp.ok) {
      const raw = await resp.text().catch(() => '');
      console.error('KWS send-email error', resp.status, raw);
      // KWS's error body shape: { error: { statusCode, code, message, errorCode } }
      // (e.g. "only email addresses (including aliases) of organization
      // members can be used in test mode") — surface it so this doesn't
      // just show as an opaque status code to whoever's testing.
      let message = `KWS error ${resp.status}`;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error?.message) message = parsed.error.message;
      } catch { /* not JSON — fall back to the generic message above */ }
      return cors(502, { error: message });
    }

    await markPending(uid, parentEmail);

    return cors(200, { ok: true, status: 'pending' });
  } catch (e) {
    console.error('kws-verify error', e);
    return cors(500, { error: 'Something went wrong starting parent verification.' });
  }
});
