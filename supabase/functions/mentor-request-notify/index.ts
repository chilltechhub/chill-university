// supabase/functions/mentor-request-notify/index.ts
//
// Emails a mentor when someone requests them, because nothing else does.
//
// The gap this closes: request_mentor() writes a row, the button flips to
// "Requested", and that was the end of it. The mentor had no way to learn a
// request existed (nothing polls mentor_requests, there is no mentor-side UI),
// and the requester had no way to learn whether it was seen. A dead end
// dressed up as a feature.
//
// Called by the after-insert trigger on mentor_requests via pg_net — see
// notify_mentor_request() in 20260906140000_community_discover.sql. Not called
// from the app, so the client can't forge a notification for an arbitrary row.
//
// Deploy:
//   supabase functions deploy mentor-request-notify --no-verify-jwt
//   supabase secrets set RESEND_API_KEY=...
//   supabase secrets set MENTOR_NOTIFY_FROM="ChillTech Hub <mentors@yourdomain.com>"
//   supabase secrets set MENTOR_NOTIFY_SECRET=<random>   # must match the Vault secret
//
// Then point the trigger at it via app_config (key 'mentor_notify', URL only —
// the shared secret lives in Supabase Vault, never in app_config, which every
// client can read). Until that row is enabled the trigger is inert and requests
// simply save as before — no errors, no half-sent mail.
//
// Provider is Resend purely because it is one key and one endpoint. Swapping to
// Postmark/SendGrid means changing sendEmail() below and nothing else.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('MENTOR_NOTIFY_FROM') ?? 'ChillTech Hub <onboarding@resend.dev>';

// Auto-injected by Supabase — nothing to set for these two.
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Shared secret the trigger sends, so only the database can invoke this.
const TRIGGER_SECRET = Deno.env.get('MENTOR_NOTIFY_SECRET');

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// Service-role read. This function needs the mentor's and requester's email
// addresses, which no client-facing RPC exposes and none should.
async function restGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
  });
  if (!res.ok) throw new Error(`rest ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function sendEmail(to: string, replyTo: string, subject: string, text: string) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      // The whole point of the notification: the mentor can just hit reply and
      // reach the person, since the app deliberately has no messaging.
      reply_to: replyTo,
      subject,
      text,
    }),
  });
  if (!res.ok) throw new Error(`resend ${res.status} ${await res.text()}`);
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });

  if (TRIGGER_SECRET) {
    const provided = req.headers.get('x-trigger-secret');
    if (provided !== TRIGGER_SECRET) return json(401, { error: 'bad trigger secret' });
  }

  let requestId: string | undefined;
  try {
    const body = await req.json();
    // pg_net sends the trigger's payload; a manual retry can send { request_id }.
    requestId = body?.request_id ?? body?.record?.id;
  } catch {
    return json(400, { error: 'invalid json' });
  }
  if (!requestId) return json(400, { error: 'request_id missing' });

  try {
    const rows = await restGet(
      `mentor_requests?id=eq.${requestId}&select=id,message,created_at,mentor_id,requester_id`,
    );
    const reqRow = rows?.[0];
    if (!reqRow) return json(404, { error: 'request not found' });

    const [mentorRows, requesterRows] = await Promise.all([
      restGet(`profiles?id=eq.${reqRow.mentor_id}&select=email,display_name,traveler_name`),
      restGet(`profiles?id=eq.${reqRow.requester_id}&select=email,display_name,traveler_name`),
    ]);

    const mentor = mentorRows?.[0];
    const requester = requesterRows?.[0];
    if (!mentor?.email) return json(422, { error: 'mentor has no email on file' });
    if (!requester?.email) return json(422, { error: 'requester has no email on file' });

    const requesterName =
      requester.traveler_name || requester.display_name || 'Someone';
    const mentorName = mentor.traveler_name || mentor.display_name || 'there';

    await sendEmail(
      mentor.email,
      requester.email,
      `${requesterName} asked to work with you`,
      [
        `Hi ${mentorName},`,
        ``,
        `${requesterName} sent you a mentor request on ChillTech Hub.`,
        ``,
        `Their message:`,
        `${(reqRow.message || '').trim() || '(no message)'}`,
        ``,
        `Reply to this email to reach them directly — replies go to ${requester.email}.`,
        `ChillTech Hub has no in-app messaging, so this email is the whole channel.`,
        ``,
        `If you'd rather not be contacted, set your mentor listing inactive in the app.`,
      ].join('\n'),
    );

    return json(200, { ok: true, notified: mentor.email });
  } catch (err) {
    console.error('[mentor-request-notify]', err);
    return json(500, { error: String(err) });
  }
});
