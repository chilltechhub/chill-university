// src/screens/studio/usePath.js
// Software for You progress, live (src/api/pathService.js), plus the Studio
// context (Builds, pet, age) the missions need. Every time a path screen
// comes into focus, finished missions are signalled again, so a goal
// started later still ticks for work already done (signalAction only
// ticks steps that are open).
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAccess } from '../../../context/AccessContext';
import useStudio from '../../logic/useStudio';
import { loadPath, savePath, cachedPath, onPathChange } from '../../api/pathService';
import { emptyProgress, pathSummary, newlyDone } from '../../logic/softwarePath';

export default function usePath() {
  const studio = useStudio();
  const { signalAction } = useAccess();
  const [progress, setProgress] = useState(() => cachedPath(null) || emptyProgress());

  useFocusEffect(useCallback(() => {
    if (!studio.ready) return undefined;
    let alive = true;
    loadPath(studio.userId).then((p) => {
      if (!alive) return;
      setProgress(p);
      pathSummary(p, studio.builds).states.filter(s => s.done)
        .forEach(s => signalAction('software-mission', { mission: s.mission.id }));
    });
    const off = onPathChange((uid, p) => { if (alive && (uid || null) === (studio.userId || null)) setProgress(p); });
    return () => { alive = false; off(); };
  }, [studio.ready, studio.userId, studio.builds, signalAction]));

  // Save a change, and signal any mission it finished.
  const update = useCallback(async (next) => {
    const before = progress;
    setProgress(next);
    await savePath(studio.userId, next);
    newlyDone(before, next, studio.builds).forEach(id => signalAction('software-mission', { mission: id }));
  }, [progress, studio.userId, studio.builds, signalAction]);

  return { studio, progress, update, summary: pathSummary(progress, studio.builds) };
}
