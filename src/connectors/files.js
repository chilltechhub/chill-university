// src/connectors/files.js
// Files: the connector that works everywhere, web included
// (docs/connections-plan-2026-10-18.md, Phase A).
//
//   In:  the Import screen ("Bring stuff in": Markdown, CSV, browser
//        bookmarks; src/logic/importParsers.js). Its own lock stays: an
//        inbox you've never sorted shouldn't get hundreds of items at once.
//   Out: the next 30 days of plans as a calendar file (Apple, Google and
//        Outlook all open .ics), and a copy of all your data (JSON).

import { getInstances } from '../api/plannerService';
import { shareMyDataExport } from '../api/dataExport';
import { buildIcs } from '../logic/calendarExport';
import { shareFile } from '../logic/shareFile';
import { todayStr, addDays } from '../logic/dateUtils';

// { count, how } — count 0 means nothing was planned, so no file.
export async function exportPlanIcs(userId) {
  const from = todayStr();
  const rows = await getInstances(userId, { weekStart: from, weekEnd: addDays(from, 30) });
  const { ics, count } = buildIcs(rows || []);
  if (!count) return { count: 0, how: null };
  const how = await shareFile({
    filename: 'deskartes-plan.ics', content: ics, mimeType: 'text/calendar',
    uti: 'com.apple.ical.ics', dialogTitle: 'Add to my calendar',
  });
  return { count, how };
}

export const exportAllData = () => shareMyDataExport();
