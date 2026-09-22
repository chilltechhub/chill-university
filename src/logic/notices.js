// src/logic/notices.js
// What the Notification Center shows under "Now": a short, ranked list of
// things worth doing, each with the one button that goes and does it.
//
// Nothing here is stored. Every notice is worked out from data that already
// exists (planner, tasks, projects, ideas, inbox, life areas, quests,
// announcements, things shared into the app) each time the center loads, so a
// notice disappears the moment its reason does — finish the task and "1 task
// overdue" is gone, no cleanup. Only what the person did to a notice
// (dismissed, snoozed, seen) is kept, in noticeStore.js, by the notice's id.
//
// Ids are stable per situation ("project-next:<id>"), so dismissing one hides
// that situation, not every future one like it.
//
// On purpose, it's a short list: at most three project notices, two ideas,
// two life areas. A wall of red badges is how apps teach people to ignore
// them — and the daily phone nudge (hubNotifications.js) only ever sends the
// single top one.
//
// Pure and import-free: scripts/check-notices.mjs runs it under node.

export const NOTICE_CATS = [
  { key: 'schedule', label: 'Plans & tasks',   icon: 'calendar-outline' },
  { key: 'quests',   label: 'Quests',          icon: 'compass-outline' },
  { key: 'projects', label: 'Projects',        icon: 'construct-outline' },
  { key: 'ideas',    label: 'Ideas',           icon: 'leaf-outline' },
  { key: 'inbox',    label: 'Capture Inbox',   icon: 'file-tray-full-outline' },
  { key: 'areas',    label: 'Life area check-ins', icon: 'pulse-outline' },
  { key: 'news',     label: 'App news',        icon: 'megaphone-outline' },
  { key: 'shared',   label: 'Shared with Deskartes', icon: 'share-outline' },
  { key: 'setup',    label: 'Setup tips',      icon: 'settings-outline' },
];

const DAY = 86400000;
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (isoStr, n) => { const [y, m, d] = isoStr.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };
const daysSince = (ts, now) => (ts ? Math.floor((now - new Date(ts)) / DAY) : null);
const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
const quote = (s) => `“${s}”`;
const clip = (s, n = 60) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || '');
const listTitles = (xs, n = 2) => {
  const names = xs.slice(0, n).map(x => clip(x.title, 40));
  return xs.length > n ? `${names.join(', ')} and ${xs.length - n} more` : names.join(' and ');
};
function time12(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
const minutesOf = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

// Planner link columns → a target (same mapping as openTarget.js, kept here
// so this file stays import-free).
function linkTarget(i) {
  if (i.link_type === 'project' && i.link_id) return { kind: 'project', id: i.link_id };
  if (i.link_type === 'idea' && i.link_id) return { kind: 'idea', id: i.link_id };
  if (i.link_type === 'vault' && i.link_id) return { kind: 'vault', id: i.link_id };
  if (i.link_type === 'quest' && i.link_screen) return { kind: 'quest', key: i.link_screen };
  return null;
}

/**
 * data: {
 *   planner:  agenda_instances rows from 7 days back to 7 days ahead
 *   tasks:    open tasks rows with a due_date
 *   projects: [{ id, title, status, next_action, created_at, updated_at, taskTotal, taskDone }]
 *   ideas:    [{ id, title, plant_type, project_id, created_at, updated_at }]
 *   inboxCount
 *   areas:    [{ key, label, last_check_date }]  (the person's life_areas rows)
 *   quests:   [{ id, title, step, stepLabel, done }]
 *   news:     [{ id, title, body, updated_at }]
 *   shared:   [{ id, text, url, receivedAt }]
 * }
 * env: { now, autoRemind, notifyPermission ('granted'|'denied'|'undetermined'|'unavailable'), wantsPhone }
 */
export function buildNotices(data, env) {
  const now = env.now || new Date();
  const today = iso(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const out = [];
  const add = (n) => out.push({ snooze: true, ...n });

  // ── Shared into the app ──────────────────────────────────────────────────
  for (const s of data.shared || []) {
    const label = clip(s.url ? s.url.replace(/^https?:\/\/(www\.)?/, '') : (s.text || 'something'), 50);
    add({
      id: `shared:${s.id}`, cat: 'shared', priority: 95, icon: 'share-outline', tone: 'teal',
      title: `You shared ${quote(label)}`,
      body: 'File it so it doesn’t get lost: save it, get a reminder, or plan it with AI.',
      primary: { label: 'File it', action: 'file-shared', payload: s.id },
      snooze: false, sharedId: s.id,
    });
  }

  // ── Plans & tasks ────────────────────────────────────────────────────────
  const planner = (data.planner || []).filter(i => !i.completed && !i.skipped);
  const overdue = planner.filter(i => i.date < today && i.date >= addDays(today, -7));
  if (overdue.length) {
    add({
      id: `plan-overdue:${today}`, cat: 'schedule', priority: 90, icon: 'time-outline', tone: 'error',
      title: `${plural(overdue.length, 'plan')} slipped past`,
      body: `${listTitles(overdue)} ${overdue.length === 1 ? 'is' : 'are'} still open from earlier days.`,
      primary: { label: 'Move to today', action: 'reschedule-overdue', payload: overdue.map(i => i.id) },
      secondary: { label: 'Open Planner', target: { kind: 'planner' } },
      ai: { target: 'planner', idea: `These plans slipped past their day: ${overdue.map(i => i.title).join('; ')}. Help me reschedule them realistically over the next few days, with reminders.` },
    });
  }
  const upcomingToday = planner
    .filter(i => i.date === today && i.start_time && minutesOf(i.start_time) >= nowMin - 15)
    .sort((a, b) => minutesOf(a.start_time) - minutesOf(b.start_time));
  const next = upcomingToday[0];
  if (next && minutesOf(next.start_time) - nowMin <= 180) {
    const tgt = linkTarget(next);
    add({
      id: `plan-next:${next.id}`, cat: 'schedule', priority: 85, icon: 'alarm-outline', tone: 'teal',
      title: `Up next at ${time12(next.start_time)}: ${clip(next.title, 50)}`,
      body: upcomingToday.length > 1 ? `Then ${listTitles(upcomingToday.slice(1))} later today.` : 'Last timed plan for today.',
      primary: tgt ? { label: 'Open it', target: tgt } : { label: 'Open Planner', target: { kind: 'planner' } },
      share: `⏰ ${next.title}\nToday at ${time12(next.start_time)}`,
    });
  }
  const lateTasks = (data.tasks || []).filter(t => !t.completed && t.due_date && t.due_date < today);
  if (lateTasks.length) {
    add({
      id: `tasks-overdue:${today}`, cat: 'schedule', priority: 80, icon: 'checkbox-outline', tone: 'error',
      title: `${plural(lateTasks.length, 'task')} overdue`,
      body: listTitles(lateTasks),
      primary: { label: 'See them', target: { kind: 'home' } },
      ai: { target: 'planner', idea: `These tasks are overdue: ${lateTasks.map(t => t.title).join('; ')}. Help me fit them into my week with times.` },
    });
  }

  // ── Quests ───────────────────────────────────────────────────────────────
  for (const q of (data.quests || []).filter(x => !x.done && x.step && x.step !== 'spark' && x.step !== 'done').slice(0, 2)) {
    add({
      id: `quest:${q.id}:${q.step}`, cat: 'quests', priority: 70, icon: 'compass-outline', tone: 'purple',
      title: `Pick up ${quote(q.title)}`,
      body: `You stopped at ${q.stepLabel}. A few minutes finishes this step.`,
      primary: { label: 'Continue', target: { kind: 'quest', key: q.id } },
      remind: { title: `Finish the quest: ${q.title}`, target: { kind: 'quest', key: q.id } },
    });
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  const projectNotices = [];
  for (const p of (data.projects || []).filter(x => x.status === 'active')) {
    const target = { kind: 'project', id: p.id };
    const quiet = daysSince(p.updated_at || p.created_at, now);
    if (p.taskTotal > 0 && p.taskDone >= p.taskTotal) {
      projectNotices.push({
        id: `project-ship:${p.id}`, cat: 'projects', priority: 62, icon: 'rocket-outline', tone: 'success',
        title: `Every task in ${quote(clip(p.title, 40))} is done`,
        body: 'Mark it shipped, or add what comes next.',
        primary: { label: 'Open project', target },
        share: `🚀 I finished every task in my project "${p.title}".`,
      });
    } else if (!p.next_action) {
      projectNotices.push({
        id: `project-next:${p.id}`, cat: 'projects', priority: 65, icon: 'footsteps-outline', tone: 'gold',
        title: `What’s the next step for ${quote(clip(p.title, 40))}?`,
        body: 'A clear next step makes it easy to start next time.',
        primary: { label: 'Set next step', target },
        ai: { target: 'projects', idea: `Break my project "${p.title}" into a clear next step and a short list of concrete tasks.` },
        remind: { title: `Work on ${p.title}`, target },
      });
    } else if (quiet !== null && quiet >= 7) {
      projectNotices.push({
        id: `project-quiet:${p.id}`, cat: 'projects', priority: 45 + Math.min(quiet, 20) / 2, icon: 'hourglass-outline', tone: 'gold',
        title: `${quote(clip(p.title, 40))} has been quiet for ${quiet} days`,
        body: `Next step: ${clip(p.next_action, 80)}`,
        primary: { label: 'Open project', target },
        ai: { target: 'projects', idea: `My project "${p.title}" stalled. The next step was "${p.next_action}". Help me restart it with 3 small tasks I can do this week.` },
        remind: { title: p.next_action, target },
      });
    }
  }
  projectNotices.sort((a, b) => b.priority - a.priority).slice(0, 3).forEach(add);

  // ── Ideas ────────────────────────────────────────────────────────────────
  (data.ideas || [])
    .filter(i => !i.project_id && (i.plant_type === 'sprout' || i.plant_type === 'plant'))
    .map(i => ({ i, age: daysSince(i.updated_at || i.created_at, now) }))
    .filter(x => x.age !== null && x.age >= 21)
    .sort((a, b) => b.age - a.age)
    .slice(0, 2)
    .forEach(({ i, age }) => add({
      id: `idea-idle:${i.id}`, cat: 'ideas', priority: 35, icon: 'leaf-outline', tone: 'success',
      title: `${quote(clip(i.title, 40))} has been sitting for ${Math.floor(age / 7)} weeks`,
      body: 'Grow it into a plan, or let it go.',
      primary: { label: 'Open idea', target: { kind: 'idea', id: i.id } },
      ai: { target: 'projects', idea: `Turn my idea "${i.title}" into a small project with a goal and first steps.` },
      remind: { title: `Think about: ${i.title}`, target: { kind: 'idea', id: i.id } },
    }));

  // ── Capture Inbox ────────────────────────────────────────────────────────
  if ((data.inboxCount || 0) >= 3) {
    add({
      id: `inbox:${today}`, cat: 'inbox', priority: 55, icon: 'file-tray-full-outline', tone: 'teal',
      title: `${plural(data.inboxCount, 'thing')} waiting in your Inbox`,
      body: 'Sort them into projects, notes or tasks while they still make sense.',
      primary: { label: 'Sort them', target: { kind: 'inbox' } },
    });
  }

  // ── Life area check-ins ──────────────────────────────────────────────────
  (data.areas || [])
    .map(a => ({ a, since: a.last_check_date ? daysSince(`${a.last_check_date}T12:00:00`, now) : null }))
    .filter(x => x.since === null || x.since >= 7)
    .sort((x, y) => (y.since ?? 999) - (x.since ?? 999))
    .slice(0, 2)
    .forEach(({ a, since }) => add({
      id: `area-checkin:${a.key}:${today}`, cat: 'areas', priority: 50, icon: 'pulse-outline', tone: 'purple',
      title: `Check in on ${a.label}`,
      body: since === null ? 'You haven’t rated it yet. It takes ten seconds.' : `Last rated ${since} days ago.`,
      primary: { label: 'Rate it', target: { kind: 'area', key: a.key } },
    }));

  // ── Weekly review (Sundays) ──────────────────────────────────────────────
  if (now.getDay() === 0) {
    add({
      id: `weekly-review:${today}`, cat: 'schedule', priority: 40, icon: 'calendar-clear-outline', tone: 'teal',
      title: 'Time for your weekly review',
      body: 'Look back at the week and pick what matters next.',
      primary: { label: 'Start review', target: { kind: 'screen', key: 'WeeklyReviewScreen' } },
      ai: { target: 'planner', idea: 'Help me plan next week: 3 priorities, and when I’ll do each one.' },
    });
  }

  // ── App news ─────────────────────────────────────────────────────────────
  for (const n of data.news || []) {
    add({
      id: `news:${n.id}:${n.updated_at || ''}`, cat: 'news', priority: 60, icon: 'megaphone-outline', tone: 'gold',
      title: n.title, body: n.body || '', snooze: false,
    });
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  const timedAhead = planner.filter(i => i.start_time && (i.date > today || (i.date === today && minutesOf(i.start_time) > nowMin))).length;
  if (env.phoneCapable && env.autoRemind === 'off' && timedAhead > 0) {
    add({
      id: 'setup-reminders', cat: 'setup', priority: 30, icon: 'notifications-outline', tone: 'teal',
      title: 'Get a heads-up before your plans',
      body: `You have ${plural(timedAhead, 'timed plan')} coming up. Turn on phone reminders so none slip by.`,
      primary: { label: 'Turn on', action: 'turn-on-reminders' }, snooze: false,
    });
  }
  if (env.phoneCapable && env.notifyPermission === 'denied' && env.wantsPhone) {
    add({
      id: 'setup-permission', cat: 'setup', priority: 88, icon: 'notifications-off-outline', tone: 'error',
      title: 'Your phone is blocking Deskartes reminders',
      body: 'Reminders are on here but notifications are off in your phone’s settings.',
      primary: { label: 'Open settings', action: 'open-settings' }, snooze: false,
    });
  }

  return out.sort((a, b) => b.priority - a.priority);
}

// Drops what the person dismissed (for 7 days; news and shared for good),
// snoozed (until the snooze ends) or switched off by category.
export function visibleNotices(notices, { dismissed = {}, snoozed = {}, cats = {} }, now = new Date()) {
  return notices.filter((n) => {
    if (cats[n.cat] === false) return false;
    const until = snoozed[n.id];
    if (until && new Date(until) > now) return false;
    const gone = dismissed[n.id];
    if (gone && (n.cat === 'news' || n.cat === 'shared' || now - new Date(gone) < 7 * DAY)) return false;
    return true;
  });
}

// The one notice worth a phone nudge: the top one that is about doing
// something, not news or settings, and not the "up next" plan (which has its
// own reminder when reminders are on).
export function pickNudge(notices) {
  return notices.find(n => !['news', 'setup', 'shared'].includes(n.cat) && !n.id.startsWith('plan-next:')) || null;
}

// "Plan my day with AI": what's on the person's plate, as a starting request.
export function planWithAIIdea(notices) {
  const lines = notices
    .filter(n => !['news', 'setup', 'shared'].includes(n.cat))
    .slice(0, 8)
    .map(n => `- ${n.title}${n.body ? ` (${n.body})` : ''}`);
  return lines.length
    ? `Here is what's on my plate right now:\n${lines.join('\n')}\n\nHelp me plan my day and the next few days around this, with times and reminders.`
    : 'Help me plan my day and the next few days, with times and reminders.';
}

// Is a HH:MM inside quiet hours that may wrap midnight (21:30 → 08:00)?
export function inQuietHours(hhmm, quiet) {
  if (!quiet?.on) return false;
  const t = minutesOf(hhmm), s = minutesOf(quiet.start), e = minutesOf(quiet.end);
  return s <= e ? t >= s && t < e : t >= s || t < e;
}
