// supabase/functions/kws-webhook/index.ts
//
// Receives the `parent-verified` event Kids Web Services sends once a
// parent/guardian completes Parent Verification (started by
// supabase/functions/kws-verify). This is called by KWS's own servers,
// not our app, so it must NOT require a Supabase user JWT — deploy it
// with --no-verify-jwt and rely entirely on the HMAC signature below for
// authenticity (see "Configure the Parent Verification Service Webhook",
// dev.epicgames.com/docs/kids-web-services/parent-verification-service).
//
// Signature scheme (from that doc, reproduced exactly):
//   header: x-kws-signature: t=<timestamp>,v1=<sig>[,v1=<sig>]
//   sig    = HMAC_SHA256(secret, `${timestamp}.${rawBody}`), hex-encoded
// A rotated secret means up to two v1 values can be present at once;
// authentic if EITHER matches a secret we hold. The raw body must be used
// as-is — never re-stringify parsed JSON before verifying.
//
// Deploy:
//   supabase functions deploy kws-webhook --no-verify-jwt
//   supabase secrets set KWS_WEBHOOK_SECRET=... [KWS_WEBHOOK_SECRET_PREVIOUS=...]
//
// Then paste this function's URL into the KWS Developer Portal's Parent
// Verification → Configuration → Webhook Method setup, which is what
// generates KWS_WEBHOOK_SECRET in the first place.

const WEBHOOK_SECRETS = [
  Deno.env.get('KWS_WEBHOOK_SECRET'),
  Deno.env.get('KWS_WEBHOOK_SECRET_PREVIOUS'), // set only while a secret rotation is in flight
].filter(Boolean) as string[];

// Supabase auto-injects these — nothing to set for these two.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

function plainText(status: number, body: string) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain' } });
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function isValidSignature(header: string, rawBody: string): Promise<boolean> {
  // header: t=1621535329,v1=abc...[,v1=def...]
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const idx = p.indexOf('=');
      return [p.slice(0, idx).trim(), p.slice(idx + 1).trim()];
    }),
  ) as Record<string, string>;
  const timestamp = parts.t;
  const providedSigs = header
    .split(',')
    .filter((p) => p.trim().startsWith('v1='))
    .map((p) => p.trim().slice(3));

  if (!timestamp || providedSigs.length === 0 || WEBHOOK_SECRETS.length === 0) return false;

  const message = `${timestamp}.${rawBody}`;
  for (const secret of WEBHOOK_SECRETS) {
    const expected = await hmacHex(secret, message);
    if (providedSigs.some((sig) => timingSafeEqual(sig, expected))) return true;
  }
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return plainText(405, 'Method not allowed');

  const rawBody = await req.text();
  const sigHeader = req.headers.get('x-kws-signature') || '';

  if (WEBHOOK_SECRETS.length === 0) {
    console.error('kws-webhook: KWS_WEBHOOK_SECRET is not set');
    return plainText(500, 'Not configured');
  }
  if (!(await isValidSignature(sigHeader, rawBody))) {
    console.error('kws-webhook: invalid signature');
    return plainText(401, 'Invalid signature');
  }

  let event: {
    name?: string;
    payload?: { externalPayload?: string; parentEmail?: string; status?: { verified?: boolean; transactionId?: string } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return plainText(400, 'Invalid JSON');
  }

  if (event.name !== 'parent-verified') {
    // Unknown/future event type — ack it so KWS doesn't retry, just ignore.
    return plainText(200, 'ignored');
  }

  const uid = event.payload?.externalPayload; // we set this to the user's id in kws-verify
  const verified = event.payload?.status?.verified === true;
  const transactionId = event.payload?.status?.transactionId || null;

  if (!uid) {
    console.error('kws-webhook: parent-verified event missing externalPayload', rawBody.slice(0, 500));
    return plainText(200, 'no externalPayload — ignored'); // 200 so KWS doesn't retry forever on a malformed/legacy event
  }

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${uid}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY as string,
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        kws_pv_status: verified ? 'verified' : 'failed',
        kws_transaction_id: transactionId,
        kws_verified_at: verified ? new Date().toISOString() : null,
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => '');
      console.error('kws-webhook: profile update failed', resp.status, detail);
      return plainText(500, 'Failed to update profile'); // non-2xx so KWS retries
    }
  } catch (e) {
    console.error('kws-webhook error', e);
    return plainText(500, 'Error updating profile');
  }

  return plainText(200, 'ok');
});
