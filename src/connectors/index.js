// src/connectors/index.js
// The live connectors (src/data/connectorsCatalog.js lists them all), one
// shape each, so app #21 never touches a screen:
//
//   supported()   can it work on this device right now
//   status()      'on' | 'off' (async)
//   connect()     'ok' | 'denied' | 'unsupported' (when there's a step)
//   disconnect()  forget the connection and what it kept on this phone
//   pull(userId)  bring things in now (when it pulls on demand)
//
// Where pulled data lands is the one layer from the connections plan:
// Stuff → the Inbox (captures), Done → Used N× on a Vault item, Numbers →
// a life area (Phase B, with Health). Nothing here adds a table.

import { Platform } from 'react-native';
import { ShareIntentModule } from 'expo-share-intent';
import { supabase } from '../api/supabaseClient';
import { fetchContentPool } from '../api/remoteConfigService';
import { CONNECTORS } from '../data/connectorsCatalog';
import {
  phoneCalendarSupported, getPhoneCalendarSettings, connectPhoneCalendar, disconnectPhoneCalendar,
} from '../api/phoneCalendar';
import {
  remindersSupported, getRemindersSettings, connectReminders, disconnectReminders, pullReminders,
} from './appleReminders';

const onOff = (b) => (b ? 'on' : 'off');

export const CONNECTOR_IMPL = {
  'share-sheet': {
    // Built into the phone app (expo-share-intent); nothing to switch on.
    supported: () => Platform.OS !== 'web' && !!ShareIntentModule,
    status: async () => 'on',
  },
  'phone-calendar': {
    supported: phoneCalendarSupported,
    status: async () => onOff((await getPhoneCalendarSettings()).connected),
    connect: connectPhoneCalendar,
    disconnect: disconnectPhoneCalendar,
  },
  'apple-reminders': {
    supported: remindersSupported,
    status: async () => onOff((await getRemindersSettings()).connected),
    connect: connectReminders,
    disconnect: disconnectReminders,
    pull: pullReminders,
  },
  files: {
    // Import and export are buttons on the screen (src/connectors/files.js).
    supported: () => true,
    status: async () => 'on',
  },
};

// The list, editable with no app update: app_content rows of type
// 'connector' (key = the connector id) change an entry's words, or add a new
// "Coming next" app. meta: { name?, icon?, examples?, reads?, writes?, phase?,
// lands?, hidden? }; the row's title is the name if meta.name is missing.
// A live connector needs code (CONNECTOR_IMPL), so a remote row can reword
// one but never turn a "soon" app live. Falls back to the bundled list.
export async function loadConnectors() {
  let rows = [];
  try { rows = await fetchContentPool('connector'); } catch { rows = []; }
  if (!rows.length) return CONNECTORS;
  const byId = Object.fromEntries(rows.map(r => [r.key, r]));
  const words = (row) => {
    const m = row?.meta || {};
    const out = {};
    ['icon', 'examples', 'reads', 'writes', 'phase', 'lands'].forEach(k => { if (m[k]) out[k] = m[k]; });
    if (m.name || row?.title) out.name = m.name || row.title;
    return out;
  };
  const merged = CONNECTORS
    .map(c => (byId[c.id] ? { ...c, ...words(byId[c.id]) } : c))
    .filter(c => !byId[c.id]?.meta?.hidden);
  const added = rows
    .filter(r => r.key && !CONNECTORS.some(c => c.id === r.key) && !r.meta?.hidden)
    .map(r => ({ id: r.key, group: 'soon', status: 'soon', icon: 'apps-outline', reads: '', writes: 'Nothing', ...words(r) }));
  return [...merged, ...added];
}

// "Request this app": one vote per app per account, kept on the profile
// (metadata.app_requests) so the founder can count them with one query and
// build the most-asked next. No new table.
export async function requestApp(userId, appId) {
  if (!userId) return { ok: false };
  const { data: row, error: readError } = await supabase.from('profiles').select('metadata').eq('id', userId).maybeSingle();
  if (readError) return { ok: false };
  const meta = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const list = Array.isArray(meta.app_requests) ? meta.app_requests : [];
  if (list.some(r => r?.id === appId)) return { ok: true };
  const { error } = await supabase.from('profiles')
    .update({ metadata: { ...meta, app_requests: [...list, { id: appId, at: new Date().toISOString() }] } })
    .eq('id', userId);
  return { ok: !error };
}
