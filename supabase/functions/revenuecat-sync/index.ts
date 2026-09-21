// supabase/functions/revenuecat-sync/index.ts
//
// The only thing that writes profiles.plan. RevenueCat knows who has paid
// (it checks the App Store / Play receipts); this asks it and copies the
// answer onto the profile, where is_plan_active() and the app read it.
//
// Two callers, one job:
//
//   1. RevenueCat's webhook, on every purchase / renewal / cancellation /
//      expiry / refund. Authenticated by the Authorization header value you
//      type into the RevenueCat dashboard, which must equal
//      REVENUECAT_WEBHOOK_AUTH. Missing secret = every webhook is refused
//      (fail closed), never accepted.
//
//   2. The app, straight after a purchase or "Restore purchases", with the
//      user's own Supabase JWT. Webhooks usually land within seconds but
//      aren't guaranteed to, and "I paid and nothing happened" is the worst
//      moment in the whole product. A signed-in user can only ever sync
//      THEIR OWN row, and the answer still comes from RevenueCat, not from
//      anything the app sends — so calling this can't grant anything the
//      store hasn't already sold.
//
// Either way the event payload is never trusted for state: we re-fetch the
// subscriber from RevenueCat's API and write what it says now. That makes
// out-of-order, duplicate and replayed webhooks harmless.
//
// The RevenueCat app user id IS the Supabase user id (src/api/purchases.js
// logs in with it), so no mapping table is needed.
//
// Deploy:
//   supabase functions deploy revenuecat-sync --no-verify-jwt
//   supabase secrets set REVENUECAT_SECRET_KEY=sk_... REVENUECAT_WEBHOOK_AUTH=<long random string>
//
// --no-verify-jwt because RevenueCat's servers have no Supabase JWT; the
// app path checks the JWT itself below.

const RC_SECRET_KEY = Deno.env.get('REVENUECAT_SECRET_KEY');
const WEBHOOK_AUTH = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
const ENTITLEMENT = Deno.env.get('REVENUECAT_ENTITLEMENT') || 'plus';

// Supabase auto-injects these.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Same lookup as kws-verify: the JWT is checked by asking Supabase Auth.
async function getCallingUserId(authHeader: string): Promise<string | null> {
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { authorization: `Bearer ${jwt}`, apikey: SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  return data?.id || null;
}

type PlanState = {
  plan: 'plus' | 'free';
  plan_expires_at: string | null;
  plan_period: string | null;
  plan_store: string | null;
  plan_will_renew: boolean | null;
};

// Ask RevenueCat what this person has right now.
async function fetchPlanState(appUserId: string): Promise<PlanState> {
  const resp = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { authorization: `Bearer ${RC_SECRET_KEY}`, accept: 'application/json' } },
  );
  if (!resp.ok) {
    throw new Error(`RevenueCat ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  }
  const { subscriber } = await resp.json();
  const ent = subscriber?.entitlements?.[ENTITLEMENT];

  const free: PlanState = {
    plan: 'free', plan_expires_at: null, plan_period: null, plan_store: null, plan_will_renew: null,
  };
  if (!ent) return free;

  // Access runs to the later of the expiry and any billing grace period —
  // the store is still giving them the product while it retries the card.
  const expires = ent.expires_date ? Date.parse(ent.expires_date) : null;
  const grace = ent.grace_period_expires_date ? Date.parse(ent.grace_period_expires_date) : null;
  const until = expires == null ? null : Math.max(expires, grace ?? 0);
  if (until != null && until <= Date.now()) return free;

  const sub = subscriber?.subscriptions?.[ent.product_identifier] || {};
  const inGrace = expires != null && expires <= Date.now();
  return {
    plan: 'plus',
    // null = lifetime / promotional without an end.
    plan_expires_at: until == null ? null : new Date(until).toISOString(),
    plan_period: inGrace ? 'grace' : (sub.period_type || null),
    plan_store: sub.store || (subscriber?.non_subscriptions?.[ent.product_identifier] ? 'app_store' : null),
    // RevenueCat marks a cancellation with unsubscribe_detected_at; it
    // clears again if they resubscribe.
    plan_will_renew: sub.unsubscribe_detected_at ? false : (expires == null ? null : true),
  };
}

async function writePlan(userId: string, state: PlanState) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      prefer: 'return=minimal',
    },
    body: JSON.stringify({ ...state, plan_updated_at: new Date().toISOString() }),
  });
  if (!resp.ok) throw new Error(`profiles update ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
}

async function logEvent(event: any, userId: string | null) {
  await fetch(`${SUPABASE_URL}/rest/v1/plus_events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY!,
      // A retried delivery of the same event id is a no-op, not an error.
      prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify({
      id: String(event.id),
      type: String(event.type || 'UNKNOWN'),
      app_user_id: event.app_user_id ?? null,
      user_id: userId,
      environment: event.environment ?? null,
      payload: event,
    }),
  }).catch((e) => console.error('revenuecat-sync: could not log event', e));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json(200, {});
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!RC_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('revenuecat-sync: REVENUECAT_SECRET_KEY is not set');
    return json(500, { error: 'Purchases are not configured yet.' });
  }

  const authHeader = req.headers.get('authorization') || '';

  // ── 1. RevenueCat webhook ──────────────────────────────────────────────
  if (WEBHOOK_AUTH && timingSafeEqual(authHeader, WEBHOOK_AUTH)) {
    let body: any;
    try { body = await req.json(); } catch { return json(400, { error: 'Invalid body' }); }
    const event = body?.event;
    if (!event?.id) return json(400, { error: 'No event' });

    // Every id this event touches. A TRANSFER moves a purchase from one
    // account to another, so BOTH sides need re-syncing.
    const ids = new Set<string>(
      [
        event.app_user_id,
        event.original_app_user_id,
        ...(event.aliases || []),
        ...(event.transferred_from || []),
        ...(event.transferred_to || []),
      ].filter((id: unknown): id is string => typeof id === 'string' && UUID_RE.test(id)),
    );

    // Anonymous RevenueCat ids ($RCAnonymousID:...) are skipped: the app
    // always logs in with the Supabase id before selling anything.
    let firstUser: string | null = null;
    try {
      for (const id of ids) {
        await writePlan(id, await fetchPlanState(id));
        firstUser ??= id;
      }
    } catch (e) {
      console.error('revenuecat-sync webhook', e);
      // Non-2xx makes RevenueCat retry later, which is what we want.
      return json(500, { error: 'Sync failed' });
    }
    await logEvent(event, firstUser);
    return json(200, { ok: true, synced: ids.size });
  }

  // ── 2. The app, for its own user ───────────────────────────────────────
  const userId = await getCallingUserId(authHeader);
  if (!userId) return json(401, { error: 'Not signed in' });

  try {
    const state = await fetchPlanState(userId);
    await writePlan(userId, state);
    return json(200, state);
  } catch (e) {
    console.error('revenuecat-sync app', e);
    return json(502, { error: 'Could not reach the store. Try again in a minute.' });
  }
});
