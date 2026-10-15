// src/logic/quickAdd.js
// Typed quick-add for the Planner: "dentist thu 4pm" → a title, a day, a
// time and a repeat. Plain functions, no imports, so a check script can run
// them (scripts/check-planner.mjs).
//
// What it reads (case doesn't matter, anywhere in the text):
//   days     today · tonight · tomorrow / tmrw · mon…sun / monday…sunday
//            (the next one; "next fri" skips a week) · in 3 days · in 2 weeks
//            · 10/20 · oct 20 / october 20 / 20 oct
//   times    4pm · 4:30 pm · 16:00 · at 4 (1–6 → pm, 7–11 → am) · noon
//   repeats  every day / daily · every week / weekly · every monday
//            · every month / monthly
// Whatever's left is the title. Nothing found → today, untimed, once.

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_RE = '(sun(?:day)?|mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?)';
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayIndex = (word) => DAYS.findIndex(d => d.startsWith(word.slice(0, 3)));
const monthIndex = (word) => MONTHS.indexOf(word.slice(0, 3));

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function plusDays(d, n) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}
// The next `weekday` after today (today itself counts only when `allowToday`).
function nextWeekday(now, weekday, allowToday = false) {
  const diff = (weekday - now.getDay() + 7) % 7;
  return plusDays(now, diff === 0 && !allowToday ? 7 : diff);
}

/**
 * @param {string} text
 * @param {Date}   now   for tests; defaults to the current time
 * @returns {{ title: string, date: string, time: string|null, cadence: 'once'|'daily'|'weekly'|'monthly', found: boolean, hasDate: boolean }}
 *   `found` is true when any day, time or repeat was read from the text;
 *   `hasDate` when a day was (otherwise `date` is today, and a caller
 *   showing some other day can use that day instead).
 */
export function parseQuickAdd(text, now = new Date()) {
  let rest = ` ${String(text || '')} `;
  let date = null;
  let time = null;
  let cadence = 'once';
  let found = false;

  const take = (re, fn) => {
    const m = rest.match(re);
    if (!m) return false;
    if (fn(m) === false) return false;
    rest = rest.replace(m[0], ' ');
    found = true;
    return true;
  };

  // ── Repeats ──
  take(/\s(?:every\s?day|daily)\s/i, () => { cadence = 'daily'; });
  take(new RegExp(`\\severy\\s+${DAY_RE}\\b`, 'i'), (m) => {
    cadence = 'weekly';
    date = nextWeekday(now, dayIndex(m[1].toLowerCase()), true);
  });
  take(/\s(?:every\s+week|weekly)\s/i, () => { cadence = 'weekly'; });
  take(/\s(?:every\s+month|monthly)\s/i, () => { cadence = 'monthly'; });

  // ── Times ── (before days, so "at 4" isn't read as a date)
  take(/\s(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)(?=\s|[.,!?]|$)/i, (m) => {
    let h = Number(m[1]);
    const min = Number(m[2] || 0);
    if (h < 1 || h > 12 || min > 59) return false;
    const pm = m[3].toLowerCase().startsWith('p');
    if (pm && h < 12) h += 12;
    if (!pm && h === 12) h = 0;
    time = `${pad(h)}:${pad(min)}`;
  });
  if (!time) take(/\s(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)(?=\s|[.,!?]|$)/, (m) => { time = `${pad(Number(m[1]))}:${m[2]}`; });
  if (!time) take(/\s(?:at\s+)?noon\s/i, () => { time = '12:00'; });
  if (!time) take(/\sat\s+(\d{1,2})(?=\s|[.,!?]|$)/i, (m) => {
    let h = Number(m[1]);
    if (h < 1 || h > 12) return false;
    if (h <= 6) h += 12;            // "at 4" means the afternoon
    else if (h === 12) h = 12;
    time = `${pad(h)}:00`;
  });

  // ── Days ──
  if (!date) take(/\stonight\s/i, () => { date = startOfDay(now); if (!time) time = '19:00'; });
  if (!date) take(/\stoday\s/i, () => { date = startOfDay(now); });
  if (!date) take(/\s(?:tomorrow|tmrw|tmr)\s/i, () => { date = plusDays(now, 1); });
  if (!date) take(/\sin\s+(\d{1,3})\s+(day|days|week|weeks)\s/i, (m) => {
    const n = Number(m[1]) * (m[2].toLowerCase().startsWith('week') ? 7 : 1);
    date = plusDays(now, n);
  });
  if (!date) take(new RegExp(`\\s(?:on\\s+)?(next\\s+)?${DAY_RE}\\b\\.?`, 'i'), (m) => {
    const d = nextWeekday(now, dayIndex(m[2].toLowerCase()));
    date = m[1] ? plusDays(d, 7) : d;
  });
  if (!date) take(new RegExp(`\\s(?:on\\s+)?${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'), (m) => {
    date = pickYear(now, monthIndex(m[1].toLowerCase()), Number(m[2]));
    if (!date) return false;
  });
  if (!date) take(new RegExp(`\\s(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+${MONTH_RE}\\b`, 'i'), (m) => {
    date = pickYear(now, monthIndex(m[2].toLowerCase()), Number(m[1]));
    if (!date) return false;
  });
  if (!date) take(/\s(?:on\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?(?=\s|[.,!?]|$)/, (m) => {
    const month = Number(m[1]) - 1;
    const day = Number(m[2]);
    if (m[3]) {
      const y = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      const d = new Date(y, month, day);
      if (d.getMonth() !== month) return false;
      date = d;
    } else {
      date = pickYear(now, month, day);
      if (!date) return false;
    }
  });

  const title = rest.replace(/\s+/g, ' ').replace(/\s+(at|on|by)$/i, '').trim()
    .replace(/^./, ch => ch.toUpperCase());
  return {
    title,
    hasDate: !!date,
    date: iso(date || startOfDay(now)),
    time,
    cadence,
    found,
  };
}

// "Oct 20" means the next one: this year, or next year once it's passed.
function pickYear(now, month, day) {
  if (month < 0 || day < 1 || day > 31) return null;
  let d = new Date(now.getFullYear(), month, day);
  if (d.getMonth() !== month) return null;
  if (d < startOfDay(now)) d = new Date(now.getFullYear() + 1, month, day);
  return d;
}

// "Thu, Oct 15 · 4:00 PM · weekly", for the preview under the box.
export function describeQuickAdd({ date, time, cadence }, now = new Date()) {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const today = startOfDay(now);
  const diff = Math.round((day - today) / 864e5);
  const dayLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow'
    : day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const parts = [dayLabel];
  if (time) {
    const [h, min] = time.split(':').map(Number);
    parts.push(`${((h + 11) % 12) + 1}:${pad(min)} ${h < 12 ? 'AM' : 'PM'}`);
  }
  if (cadence !== 'once') parts.push(cadence === 'daily' ? 'every day' : cadence === 'weekly' ? 'every week' : 'every month');
  return parts.join(' · ');
}
