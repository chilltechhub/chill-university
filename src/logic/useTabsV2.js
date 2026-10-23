// src/logic/useTabsV2.js
// TABS_V2: the tabs Today · Learn · Make, the new top bar and You
// (docs/shake-up-plan-2026-10-21.md P4). The rule is tabsV2On in
// src/logic/welcomeCards.js: set either way, the setting wins; unset, it
// follows Today (DASHBOARD_V2), so the new app comes on as one piece.
//
// On, it also switches the Profile → You route alias (routeAliases.js).
// Off is the rollback: Library · Home · Learn, the old top bar and Profile.
//
// Like useDashboardV2, a shared store with the last answer kept, so a
// screen that mounts later starts from it instead of from "off".

import { useEffect, useState } from 'react';
import { SETTING_KEYS, readSetting, writeSetting, peekSetting } from './useSetting';
import { onPrefsRestored } from './prefsSync';
import { setAliasGate } from './routeAliases';
import { tabsV2On } from './welcomeCards';
import useDashboardV2 from './useDashboardV2';

const KEY = SETTING_KEYS.TABS_V2;
const UNKNOWN = Symbol('unknown');
const known = { on: null };
const listeners = new Set();
const tell = (v) => listeners.forEach(fn => fn(v));

/** Make it yours: the new tabs on or off for this account. */
export async function setTabsV2(value) {
  await writeSetting(KEY, value);
  tell(value);
}

export default function useTabsV2() {
  const [dashboardV2, , , dashSettled] = useDashboardV2();
  const [setting, setSetting] = useState(() => peekSetting(KEY, UNKNOWN));

  useEffect(() => {
    let alive = true;
    const read = () => readSetting(KEY, null).then(v => { if (alive) setSetting(v); });
    read();
    listeners.add(setSetting);
    const off = onPrefsRestored(read);
    return () => { alive = false; listeners.delete(setSetting); off(); };
  }, []);

  const settled = setting !== UNKNOWN && (setting !== null || dashSettled);
  const on = settled ? tabsV2On(setting, dashboardV2) : !!known.on;
  if (settled) { known.on = on; setAliasGate('tabsV2', on); }
  useEffect(() => { if (settled) setAliasGate('tabsV2', on); }, [on, settled]);
  return [on, setTabsV2, setting === UNKNOWN ? null : setting, settled];
}
