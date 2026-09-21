// src/logic/shareOut.js
// Sharing out of the app: the phone's share sheet on iOS/Android, the
// browser's on web, and the clipboard wherever neither exists. Plus the text
// a reminder, a day's plan or a project turns into when it's shared.
//
// Resolves 'shared' | 'copied' | 'dismissed' | 'failed', so the caller can
// say "Copied" when that's what actually happened.

import { Share, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export async function shareText({ title, message }) {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title, text: message });
          return 'shared';
        } catch (e) {
          if (e?.name === 'AbortError') return 'dismissed';
        }
      }
      await Clipboard.setStringAsync(message);
      return 'copied';
    }
    const res = await Share.share(title ? { title, message } : { message });
    return res?.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    try { await Clipboard.setStringAsync(message); return 'copied'; } catch { return 'failed'; }
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtTime12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = String(hhmm).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function fmtDay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${WEEKDAYS[dt.getDay()]} ${MONTHS[m - 1]} ${d}`;
}

export function reminderText(item) {
  const when = [fmtDay(item.date), fmtTime12(item.start_time || item.time)].filter(Boolean).join(' at ');
  return [`⏰ ${item.title}`, when, item.notes].filter(Boolean).join('\n');
}

export function dayPlanText(items, label) {
  const lines = items.map(i => `${i.completed ? '✓' : '•'} ${i.start_time ? `${fmtTime12(i.start_time)}  ` : ''}${i.title}`);
  return [`My plan for ${label}`, '', ...(lines.length ? lines : ['Nothing planned yet.'])].join('\n');
}

export function projectText(project, tasks = []) {
  const open = tasks.filter(t => !t.completed).slice(0, 10);
  return [
    `🏗️ ${project.title}`,
    project.objective ? `Goal: ${project.objective}` : null,
    project.next_action ? `Next step: ${project.next_action}` : null,
    open.length ? '' : null,
    ...(open.length ? ['To do:', ...open.map(t => `• ${t.title}`)] : []),
  ].filter(x => x !== null).join('\n');
}
