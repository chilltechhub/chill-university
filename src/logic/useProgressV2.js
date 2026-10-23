// src/logic/useProgressV2.js
// PROGRESS_V2: receipts, not a score (docs/shake-up-plan-2026-10-21.md P5).
// The rule is progressV2On in src/logic/welcomeCards.js: set either way, the
// setting wins; unset, it follows the new tabs (TABS_V2), so the new app
// comes on as one piece.
//
// On: the level-up popup is a quiet line, real work says a mentor line
// instead of "+N XP", Unlocked cards say "Your map got bigger", the
// leaderboard and Challenges step aside, and Insights opens You's receipts
// (the Stats → You alias's 'receipts' gate). Off is the rollback: the old
// popups and the top bar's level and points.

import { useEffect, useState } from 'react';
import { SETTING_KEYS, readSetting, writeSetting, peekSetting } from './useSetting';
import { onPrefsRestored } from './prefsSync';
import { setAliasGate } from './routeAliases';
import { progressV2On } from './welcomeCards';
import useTabsV2 from './useTabsV2';

const KEY = SETTING_KEYS.PROGRESS_V2;
const UNKNOWN = Symbol('unknown');
const known = { on: null };
const listeners = new Set();
const tell = (v) => listeners.forEach(fn => fn(v));

/** Make it yours: receipts on or off for this account. */
export async function setProgressV2(value) {
  await writeSetting(KEY, value);
  tell(value);
}

export default function useProgressV2() {
  const [tabsV2, , , tabsSettled] = useTabsV2();
  const [setting, setSetting] = useState(() => peekSetting(KEY, UNKNOWN));

  useEffect(() => {
    let alive = true;
    const read = () => readSetting(KEY, null).then(v => { if (alive) setSetting(v); });
    read();
    listeners.add(setSetting);
    const off = onPrefsRestored(read);
    return () => { alive = false; listeners.delete(setSetting); off(); };
  }, []);

  const settled = setting !== UNKNOWN && (setting !== null || tabsSettled);
  const on = settled ? progressV2On(setting, tabsV2) : !!known.on;
  if (settled) { known.on = on; setAliasGate('receipts', on); }
  useEffect(() => { if (settled) setAliasGate('receipts', on); }, [on, settled]);
  return [on, setProgressV2, setting === UNKNOWN ? null : setting, settled];
}
