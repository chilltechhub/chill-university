// src/logic/useDashboardV2.js
// DASHBOARD_V2: Today as the Planner dashboard (docs/shake-up-plan-2026-10-21.md
// P3). The rule is dashboardV2On in src/logic/welcomeCards.js:
//   - set either way, the setting wins (Make it yours, for this release)
//   - unset: on for an account made through the welcome
//     (metadata.shakeup_onboarded_at) and a guest who kept going from it
//
// On, it also switches the PlannerScreen → Home route alias
// (src/logic/routeAliases.js), so every old link to the Planner opens Today
// on the right day. Off is the rollback: the old Home and Planner, both
// still registered.
//
// A shared store rather than useSetting: App.js (the alias, the FAB) reads
// it outside any screen, where focus hooks don't exist.
//
// A screen that mounts later starts from the last answer, not from "off":
// PlannerScreen's redirect would otherwise draw the old Planner for a frame
// (which eats the link's day), and the alias gate would flip off with it.
// `settled` (the 4th value) says the answer is this account's, read.

import { useEffect, useState } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { SETTING_KEYS, readSetting, writeSetting, peekSetting } from './useSetting';
import { onPrefsRestored } from './prefsSync';
import { setAliasGate } from './routeAliases';
import { dashboardV2On } from './welcomeCards';
import { loadWelcome, onWelcomeChange } from '../api/welcomeStore';

const KEY = SETTING_KEYS.DASHBOARD_V2;
const UNKNOWN = Symbol('unknown');
const known = { on: null, welcomeGuest: null };
const listeners = new Set();
const tell = (v) => listeners.forEach(fn => fn(v));

/** Make it yours: switch Today on or off for this account. */
export async function setDashboardV2(value) {
  await writeSetting(KEY, value);
  tell(value);
}

export default function useDashboardV2() {
  const { user, profile } = useUserProgress();
  const [setting, setSetting] = useState(() => peekSetting(KEY, UNKNOWN));
  const [welcomeGuest, setWelcomeGuest] = useState(() => known.welcomeGuest);

  useEffect(() => {
    let alive = true;
    const read = () => readSetting(KEY, null).then(v => { if (alive) setSetting(v); });
    read();
    listeners.add(setSetting);
    const off = onPrefsRestored(read);
    return () => { alive = false; listeners.delete(setSetting); off(); };
  }, []);

  useEffect(() => {
    if (user) return undefined;
    let alive = true;
    const take = (w) => { known.welcomeGuest = !!(w.done && w.guest); if (alive) setWelcomeGuest(known.welcomeGuest); };
    loadWelcome().then(take);
    const off = onWelcomeChange(take);
    return () => { alive = false; off(); };
  }, [user?.id]);

  // Read enough to answer: the setting, and when it's unset, the profile
  // (signed in) or the welcome (a guest).
  const settled = setting !== UNKNOWN && (setting !== null || (user ? !!profile : welcomeGuest !== null));
  const on = settled
    ? dashboardV2On(setting, {
      signedIn: !!user,
      onboardedAt: profile?.metadata?.shakeup_onboarded_at || null,
      welcomeGuest: !!welcomeGuest,
    })
    : !!known.on;
  // Set during render as well as in the effect: a link followed in the same
  // tick as the switch (Make it yours → Today) must already resolve.
  if (settled) { known.on = on; setAliasGate('dashboardV2', on); }
  useEffect(() => { if (settled) setAliasGate('dashboardV2', on); }, [on, settled]);
  return [on, setDashboardV2, setting === UNKNOWN ? null : setting, settled];
}
