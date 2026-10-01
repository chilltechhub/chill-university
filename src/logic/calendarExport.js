// src/logic/calendarExport.js
// Planner → your phone's calendar, as a standard .ics file (Apple Calendar,
// Google Calendar and Outlook all open it). One-way and on request: the
// Planner stays the source of truth, and nothing syncs back.
//
// Timed items become events in local time ("floating", no time zone), so
// 9:00 stays 9:00 wherever the phone is. Items without a time become all-day
// events. Done and skipped items are left out.

const pad = (n) => String(n).padStart(2, '0');

// RFC 5545 text: escape backslash, semicolon, comma and newlines.
function esc(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Lines longer than 75 octets fold onto continuation lines starting with a space.
function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
}

const ymd = (dateStr) => String(dateStr).slice(0, 10).replace(/-/g, '');

function addMinutes(dateStr, hhmm, minutes) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const [h, mi] = String(hhmm).split(':').map(Number);
  const dt = new Date(y, m - 1, d, h, mi + minutes);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function nextDay(dateStr) {
  const [y, m, d] = String(dateStr).slice(0, 10).split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`;
}

function stamp(now = new Date()) {
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

export function buildIcs(items, { now = new Date() } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChillTech Hub//Deskartes//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Deskartes plan',
  ];
  const dtstamp = stamp(now);
  let count = 0;
  for (const it of items || []) {
    if (!it?.date || it.completed || it.skipped || !it.title) continue;
    const time = /^\d{1,2}:\d{2}/.test(it.start_time || '') ? String(it.start_time).slice(0, 5) : null;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${esc(it.id || `${ymd(it.date)}-${count}`)}@deskartes`);
    lines.push(`DTSTAMP:${dtstamp}`);
    if (time) {
      const mins = Math.max(5, Number(it.duration_minutes) || 30);
      lines.push(`DTSTART:${addMinutes(it.date, time, 0)}`);
      lines.push(`DTEND:${addMinutes(it.date, time, mins)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${ymd(it.date)}`);
      lines.push(`DTEND;VALUE=DATE:${nextDay(it.date)}`);
    }
    lines.push(fold(`SUMMARY:${esc(it.title)}`));
    if (it.notes) lines.push(fold(`DESCRIPTION:${esc(it.notes)}`));
    lines.push('END:VEVENT');
    count++;
  }
  lines.push('END:VCALENDAR');
  return { ics: lines.join('\r\n') + '\r\n', count };
}
