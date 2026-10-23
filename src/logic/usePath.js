// src/logic/usePath.js
// Which path someone is on, and where they started (shake-up P6). Signed
// in: profiles.metadata.path_key / start_point / shakiest. A guest: the
// welcome's answers on the phone. "The ground" as the shakiest circle puts
// the Ground fix first, whatever the path after it is (§8.1).
//
// setPath writes the same places the welcome and the "Pick your path" note
// do, so every screen reads one answer.

import { useCallback, useEffect, useState } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { mergeProfileMetadata } from '../api/accessService';
import { loadWelcome, saveWelcome, onWelcomeChange } from '../api/welcomeStore';
import { PATH_KITS, DEFAULT_PATH } from '../data/pathKits';

export default function usePath() {
  const { user, profile, refreshProfile } = useUserProgress();
  const [welcome, setWelcome] = useState(null);
  useEffect(() => {
    if (user) return undefined;
    let alive = true;
    loadWelcome().then(w => { if (alive) setWelcome(w); }).catch(() => {});
    const off = onWelcomeChange(w => setWelcome(w));
    return () => { alive = false; off(); };
  }, [user?.id]);

  const meta = user ? (profile?.metadata || {}) : (welcome || {});
  const picked = user ? meta.path_key : meta.pathKey;
  const pathKey = PATH_KITS[picked] ? picked : DEFAULT_PATH;
  const startPoint = user ? meta.start_point || null : meta.startPoint || null;
  const shakiest = user ? meta.shakiest || null : meta.shakiest || null;

  const setPath = useCallback(async (key) => {
    if (!PATH_KITS[key]) return;
    if (user) {
      await mergeProfileMetadata(user.id, { path_key: key });
      try { await refreshProfile?.(); } catch {}
    } else {
      await saveWelcome({ pathKey: key });
    }
  }, [user, refreshProfile]);

  return { pathKey, picked: !!picked, startPoint, shakiest, groundFirst: shakiest === 'ground', setPath };
}
