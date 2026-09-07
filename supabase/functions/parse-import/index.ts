// supabase/functions/parse-import/index.ts
//
// Server-side proxy to the Claude API for the Import Hub (ImportScreen.js).
//
// Why this exists instead of calling api.anthropic.com straight from the app:
// a React Native/Expo client ships as a downloadable bundle, so any secret
// referenced in client code (including EXPO_PUBLIC_* env vars) is readable by
// anyone who unpacks the app. An Anthropic API key must never live there.
// This function holds the key as a Supabase Edge Function secret (server-side
// only) and the app calls this function instead of Anthropic directly.
//
// Users can also bypass this entirely by saving their own key in Settings —
// see src/api/importAI.js, which mirrors this same prompt/schema for that path.
//
// Deploy:
//   supabase functions deploy parse-import
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Requires the caller to be authenticated — Supabase's function gateway
// checks the JWT before this code runs (deploy without --no-verify-jwt).

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const MODEL = 'claude-sonnet-5';
const MAX_INPUT_CHARS = 60000;

const CAPTURE_TYPES = ['note', 'idea', 'link', 'video', 'resource', 'task'];
const LIFE_AREAS = ['physical', 'mental', 'social', 'financial', 'professional', 'spiritual', 'creative', 'digital'];

// Forcing a tool call (instead of asking nicely in the prompt) is the
// reliable way to get structured JSON out of Claude — no markdown fences or
// stray commentary to strip.
const RETURN_ITEMS_TOOL = {
  name: 'return_items',
  description: 'Return the parsed list of items for a personal capture inbox.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short, human-readable title.' },
            url: { type: 'string', description: 'The URL, if this item has one. Omit for a plain note/idea.' },
            type: { type: 'string', enum: CAPTURE_TYPES },
            description: { type: 'string', description: 'One short sentence. Empty string if nothing to add.' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 4,
              description: '2-4 short lowercase topical tags.',
            },
            life_area: { type: 'string', enum: LIFE_AREAS, description: "Best-matching life area, only if it clearly fits one of the user's tracked areas. Omit otherwise." },
            match_type: { type: 'string', enum: ['project', 'idea'], description: 'Set only when match_id is a confident match from the CONTEXT block.' },
            match_id: { type: 'string', description: 'The exact id of a project or idea from the CONTEXT block, only when confident. Omit if no good match.' },
          },
          required: ['title', 'type', 'description', 'tags'],
        },
      },
    },
    required: ['items'],
  },
};

function systemPrompt(format: string) {
  const shared = `
Also, for each item, decide:
- life_area: one of ${LIFE_AREAS.join(' | ')} — only if the item clearly relates to one of the user's tracked life areas. Omit the field if it doesn't fit any of them.
- match_type + match_id: if a CONTEXT block is present in the input, listing existing projects or ideas, and this item is clearly about one of them, set match_type to "project" or "idea" and match_id to that exact id from the list. Omit both fields if there's no confident match — never guess or invent an id.`;

  if (format === 'enrich') {
    return `You improve a list of already-extracted items (each has a title and maybe a url) for a personal capture inbox called ChillTech Hub. Keeping each item's title and url exactly as given and in the same order, decide for each one:
- type: one of ${CAPTURE_TYPES.join(' | ')}
- description: one short sentence, empty string if nothing to add
- tags: 2-4 short lowercase topical tags
${shared}

If the input starts with a CONTEXT block, use it for life_area/match_type/match_id — it is not itself content to include as an item.

Return exactly the same number of items, in the same order. Call return_items. No commentary outside the tool call.`;
  }

  return `You extract structured items from raw pasted content (URLs, browser bookmark HTML exports, markdown link lists, plain text with links, tab dumps) for a personal capture inbox called ChillTech Hub.

Format hint from the user: ${format || 'auto-detect'}.

For every distinct item you find (a link, or — if there are no links — a distinct note/idea worth capturing):
- title: short, human-readable title (use the bookmark/link text if present, otherwise infer from the URL)
- url: the URL if present, omit the field entirely for a plain note/idea with no link
- type: one of ${CAPTURE_TYPES.join(' | ')} — use "video" for youtube/vimeo links, "task" for clearly actionable to-dos, "resource" for tools/references, "link" as the default for a plain bookmark, "note"/"idea" for non-URL text
- description: one short sentence, empty string if nothing meaningful to add
- tags: 2-4 short lowercase topical tags
${shared}

If the input starts with a CONTEXT block (the user's real life areas, projects, and ideas), use it for life_area/match_type/match_id, then parse the CONTENT block that follows it — the context itself is not content to extract items from.

Deduplicate by URL — if the same URL appears more than once in the input, return it only once. Call the return_items tool with your result. Do not include any commentary outside the tool call.`;
}

function buildMessage(text: string, context: any) {
  if (!context) return text;
  const projects = Array.isArray(context.projects) ? context.projects.map((p: any) => ({ id: p.id, title: p.title })) : [];
  const ideas = Array.isArray(context.ideas) ? context.ideas.map((i: any) => ({ id: i.id, title: i.title })) : [];
  if (projects.length === 0 && ideas.length === 0) return text;
  const ctx = { life_areas: LIFE_AREAS, projects, ideas };
  return `CONTEXT (the user's real projects and ideas — use exact ids from here, or omit match_type/match_id if nothing fits):\n${JSON.stringify(ctx)}\n\nCONTENT:\n${text}`;
}

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return cors(200, {});
  if (req.method !== 'POST') return cors(405, { error: 'Method not allowed' });

  let body: { text?: string; format?: string; context?: any };
  try {
    body = await req.json();
  } catch {
    return cors(400, { error: 'Invalid request body' });
  }

  const text = (body.text || '').trim();
  const format = body.format || 'auto';

  if (!text) return cors(400, { error: 'Paste something first.' });
  if (text.length > MAX_INPUT_CHARS) {
    return cors(400, { error: `That's a lot to analyze at once — paste a smaller chunk (under ${MAX_INPUT_CHARS.toLocaleString()} characters).` });
  }
  if (!ANTHROPIC_API_KEY) {
    console.error('parse-import: ANTHROPIC_API_KEY secret is not set');
    return cors(500, { error: 'Import isn’t configured yet — ask the app owner to set ANTHROPIC_API_KEY.' });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt(format),
        messages: [{ role: 'user', content: buildMessage(text, body.context) }],
        tools: [RETURN_ITEMS_TOOL],
        tool_choice: { type: 'tool', name: 'return_items' },
      }),
    });

    if (!resp.ok) {
      let detail = '';
      try { detail = (await resp.json())?.error?.message || ''; } catch { detail = await resp.text().catch(() => ''); }
      console.error('Anthropic API error', resp.status, detail);
      return cors(502, { error: `Anthropic error ${resp.status}${detail ? ': ' + detail : ''}` });
    }

    const data = await resp.json();
    const toolUse = (data?.content || []).find((b: any) => b.type === 'tool_use' && b.name === 'return_items');
    const items = toolUse?.input?.items;

    if (!Array.isArray(items)) {
      console.error('parse-import: no tool_use items in response', JSON.stringify(data).slice(0, 500));
      return cors(502, { error: 'Could not parse a result from the model. Try again.' });
    }

    return cors(200, { items });
  } catch (e) {
    console.error('parse-import error', e);
    return cors(500, { error: 'Something went wrong analyzing your paste.' });
  }
});
