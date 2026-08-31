// src/api/importAI.js
// Single entry point the Import Hub calls to get AI help — either extracting
// items from freeform text, or enriching already-parsed items with
// type/description/tags/life-area/project-or-idea match.
//
// Picks a transport automatically:
//  - If the user saved their own Anthropic key in Settings, call Anthropic
//    directly from the device with it (their key, their request).
//  - Otherwise, fall back to the shared supabase/functions/parse-import
//    Edge Function (the app owner's key, never present in this bundle).
import { Platform } from 'react-native';
import { getUserApiKey } from './aiKey';
import { supabase } from './supabaseClient';

const MODEL = 'claude-sonnet-5';
const CAPTURE_TYPES = ['note', 'idea', 'link', 'video', 'resource', 'task'];
const LIFE_AREAS = ['physical', 'mental', 'social', 'financial', 'professional', 'spiritual', 'creative', 'digital'];

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
            title: { type: 'string' },
            url: { type: 'string' },
            type: { type: 'string', enum: CAPTURE_TYPES },
            description: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 4 },
            life_area: { type: 'string', enum: LIFE_AREAS, description: 'Best-matching life area, only if it clearly fits one. Omit otherwise.' },
            match_type: { type: 'string', enum: ['project', 'idea'], description: 'Set only when match_id is a confident match from the provided context.' },
            match_id: { type: 'string', description: 'The exact id of a project or idea from the context list, only when confident. Omit if no good match.' },
          },
          required: ['title', 'type', 'description', 'tags'],
        },
      },
    },
    required: ['items'],
  },
};

function systemPrompt(format) {
  const shared = `
Also, for each item, decide:
- life_area: one of ${LIFE_AREAS.join(' | ')} — only if the item clearly relates to one of the user's tracked life areas. Omit the field if it doesn't fit any of them.
- match_type + match_id: if the CONTEXT block lists existing projects or ideas and this item is clearly about one of them, set match_type to "project" or "idea" and match_id to that exact id from the list. Omit both fields if there's no confident match — do not guess or invent an id.`;

  if (format === 'enrich') {
    return `You improve a list of already-extracted items (each has a title and maybe a url) for a personal capture inbox called ChillTech Hub. Keeping each item's title and url exactly as given and in the same order, decide for each one:
- type: one of ${CAPTURE_TYPES.join(' | ')}
- description: one short sentence, empty string if nothing to add
- tags: 2-4 short lowercase topical tags
${shared}

If the input starts with a CONTEXT block (the user's real life areas, projects, and ideas), use it for life_area/match_type/match_id — it will not appear in the output.

Return exactly the same number of items, in the same order. Call return_items. No commentary outside the tool call.`;
  }
  return `You extract structured items from raw pasted content (URLs, browser bookmark exports, markdown link lists, plain text with links, tab dumps) for a personal capture inbox called ChillTech Hub.

For every distinct item you find (a link, or — if there are no links — a distinct note/idea worth capturing):
- title: short, human-readable title
- url: the URL if present, omit the field entirely for a plain note/idea with no link
- type: one of ${CAPTURE_TYPES.join(' | ')}
- description: one short sentence, empty string if nothing meaningful to add
- tags: 2-4 short lowercase topical tags
${shared}

If the input starts with a CONTEXT block (the user's real life areas, projects, and ideas), use it for life_area/match_type/match_id, then parse the CONTENT block that follows it — the context itself is not content to extract items from.

Deduplicate by URL. Call return_items. No commentary outside the tool call.`;
}

// Prepends the user's real life areas / projects / ideas so the model can
// reference actual ids instead of guessing at generic categories.
function buildMessage(text, context) {
  if (!context) return text;
  const ctx = {
    life_areas: LIFE_AREAS,
    projects: (context.projects || []).map(p => ({ id: p.id, title: p.title })),
    ideas: (context.ideas || []).map(i => ({ id: i.id, title: i.title })),
  };
  if (ctx.projects.length === 0 && ctx.ideas.length === 0) return text;
  return `CONTEXT (your real projects and ideas — use exact ids from here, or omit match_type/match_id if nothing fits):\n${JSON.stringify(ctx)}\n\nCONTENT:\n${text}`;
}

async function callEdgeFunction(text, format, context) {
  const { data, error } = await supabase.functions.invoke('parse-import', { body: { text, format, context } });
  if (error) throw new Error(error.message || 'The import assistant is unavailable right now.');
  if (data?.error) throw new Error(data.error);
  if (!Array.isArray(data?.items)) throw new Error('Could not parse a result from the model.');
  return data.items;
}

async function callAnthropicDirect(apiKey, text, format, context) {
  const headers = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
  // Required for a direct browser->Anthropic call (Expo web only; native has no CORS concern).
  if (Platform.OS === 'web') headers['anthropic-dangerous-direct-browser-access'] = 'true';

  let resp;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt(format),
        messages: [{ role: 'user', content: buildMessage(text, context) }],
        tools: [RETURN_ITEMS_TOOL],
        tool_choice: { type: 'tool', name: 'return_items' },
      }),
    });
  } catch (networkErr) {
    console.error('importAI: network error calling Anthropic directly', networkErr);
    throw new Error(`Could not reach Anthropic (${networkErr.message || 'network error'}). On web this can be a CORS/network block — try again, or clear your key in Settings to use the app's built-in import instead.`);
  }

  if (!resp.ok) {
    let detail = '';
    try {
      const body = await resp.json();
      detail = body?.error?.message || '';
    } catch {
      detail = await resp.text().catch(() => '');
    }
    console.error('importAI: Anthropic API error', resp.status, detail);
    if (resp.status === 401) throw new Error('Your API key was rejected — check it in Settings.');
    if (resp.status === 429) throw new Error('Rate limited by Anthropic — wait a moment and try again.');
    throw new Error(`Anthropic error ${resp.status}${detail ? ': ' + detail : ''}`);
  }

  const data = await resp.json();
  const toolUse = (data.content || []).find(b => b.type === 'tool_use' && b.name === 'return_items');
  const items = toolUse?.input?.items;
  if (!Array.isArray(items)) {
    console.error('importAI: no tool_use items in response', JSON.stringify(data).slice(0, 500));
    throw new Error('Could not parse a result from the model. Check the console for details.');
  }
  return items;
}

// text: raw paste (format 'auto'/etc), or JSON.stringify of [{title,url}] (format 'enrich')
// context: optional { projects: [{id,title}], ideas: [{id,title}] } — your real data to match against
export async function analyzeWithAI(text, format, context) {
  const key = await getUserApiKey();
  if (key) return callAnthropicDirect(key, text, format, context);
  return callEdgeFunction(text, format, context);
}

export async function hasUserApiKey() {
  return !!(await getUserApiKey());
}
