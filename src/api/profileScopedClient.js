// src/api/profileScopedClient.js
// Automatic per-Profile scoping for user content tables.
//
// ── Why this is centralised rather than done at each call site ───────────────
// Content queries are spread across ~30 files and ~165 call sites
// (captureService, plannerService, gardenService, HomeScreen, PlannerScreen,
// CalendarModal, the whole library/ tree...). Adding `.eq('profile_id', ...)`
// by hand at every one of them is a change where missing a single site is not
// a cosmetic bug: it's someone's night-job task showing up in their personal
// list, or a project silently vanishing because its profile_id was never
// written on insert.
//
// So `supabase.from('projects')` is wrapped once, here, and every read, write,
// update and delete on a scoped table is filtered and stamped automatically.
// One place to reason about, one place to get right, and impossible to forget
// at a call site because call sites don't participate.
//
// ── The escape hatch ─────────────────────────────────────────────────────────
// Some queries genuinely need to cross profiles — the master's roll-up, global
// search when it's showing everything, the trash view, and the calendar's
// "all profiles" mode. Those use `unscoped.from(...)`, which is the raw
// client. Reaching for it should be a deliberate, visible act; that's the
// point of it having a different name.
//
// ── What it does not touch ───────────────────────────────────────────────────
// Tables not in SCOPED_TABLES pass through untouched: profiles, user_missions,
// subject_progress, user_settings, life_areas, activity_log, and everything
// else that is shared across profiles by design. Child tables
// (project_tasks, garden_vines, ...) are also untouched — they inherit scoping
// from the parent row they hang off.

import { supabase as rawClient } from './supabaseClient';
import { getActiveProfileId } from '../logic/activeProfile';

// Root content tables that carry a profile_id
// (see 20260910160000_scope_content_to_profiles.sql).
export const SCOPED_TABLES = new Set([
  'projects',
  'captures',
  'tasks',
  'priority_tasks',
  'area_notes',
  'garden_cores',
  'portfolio_entries',
  'daily_focus',
  'timer_sessions',
  'daily_checkins',
  'agenda_instances',
  'calendar_events',
]);

// The raw client, for the deliberate cross-profile cases.
export const unscoped = rawClient;

function stamp(payload, profileId) {
  if (Array.isArray(payload)) {
    return payload.map(row => (
      row && typeof row === 'object' && row.profile_id === undefined
        ? { ...row, profile_id: profileId }
        : row
    ));
  }
  if (payload && typeof payload === 'object' && payload.profile_id === undefined) {
    return { ...payload, profile_id: profileId };
  }
  // An explicit profile_id already set by the caller wins — that's how you
  // deliberately write into another profile (e.g. moving an item).
  return payload;
}

// ── Version-skew safety net ──────────────────────────────────────────────────
// A mobile app cannot assume its client and its database move together: an old
// binary can run against a migrated database, and a new binary can run against
// one where 20260910160000_scope_content_to_profiles.sql hasn't landed yet.
// In that second case every scoped read comes back 42703 (undefined_column)
// and the user stares at empty screens with no idea why.
//
// So: the first time a scoped query fails because profile_id doesn't exist,
// stop adding the filter. The app then behaves exactly as it did before
// profiles — every row visible to the user, nothing lost — instead of
// appearing to have deleted all their work. Degraded, but honest and
// recoverable, and it flips back on its own once the migration lands and the
// flag is cleared on next launch.
let profileColumnMissing = false;

function noteQueryResult(res) {
  if (res && res.error && res.error.code === '42703' && /profile_id/.test(res.error.message || '')) {
    if (!profileColumnMissing) {
      console.warn(
        '[profiles] profile_id column not found — falling back to unscoped reads. ' +
        'Run supabase/migrations/20260910160000_scope_content_to_profiles.sql.'
      );
    }
    profileColumnMissing = true;
  }
  return res;
}

// Wraps the thenable filter builder so results pass through noteQueryResult.
function watch(builder) {
  if (!builder || typeof builder.then !== 'function') return builder;
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (onFulfilled, onRejected) =>
          target.then(res => onFulfilled ? onFulfilled(noteQueryResult(res)) : noteQueryResult(res), onRejected);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args) => {
        const next = value.apply(target, args);
        // Filter methods return the builder again — keep it wrapped so the
        // watch survives however long the caller's chain is.
        return next === target || (next && typeof next.then === 'function') ? watch(next) : next;
      };
    },
  });
}

function wrapBuilder(table) {
  const profileId = getActiveProfileId();
  const qb = rawClient.from(table);

  // Column isn't there — behave exactly like the pre-profiles app.
  if (profileColumnMissing) return qb;

  // No resolved profile — a guest, or the moment before the first load lands.
  // Pass through unfiltered rather than filtering on null, which would return
  // nothing and flash an empty screen at someone who has plenty. Rows are
  // still scoped to their user_id by RLS either way.
  if (!profileId) return qb;

  return new Proxy(qb, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;

      // Reads and mutations that return a filter builder: apply the profile
      // filter immediately, so it's present no matter what the caller chains
      // afterwards.
      if (prop === 'select' || prop === 'update' || prop === 'delete') {
        return (...args) => {
          const next = value.apply(target, args);
          return next && typeof next.eq === 'function'
            ? watch(next.eq('profile_id', profileId))
            : next;
        };
      }

      // Writes: stamp the profile onto the row(s) so a new item belongs to the
      // profile it was created in.
      if (prop === 'insert' || prop === 'upsert') {
        return (payload, ...rest) => value.apply(target, [stamp(payload, profileId), ...rest]);
      }

      return value.bind(target);
    },
  });
}

// Drop-in replacement for the supabase client. Same shape; `from()` is scoped
// for content tables and identical for everything else.
export const supabase = new Proxy(rawClient, {
  get(target, prop, receiver) {
    if (prop === 'from') {
      return (table) => (SCOPED_TABLES.has(table) ? wrapBuilder(table) : rawClient.from(table));
    }
    const value = Reflect.get(target, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

export default supabase;
