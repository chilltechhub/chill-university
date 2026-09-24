// src/logic/useDrillPlan.js
// Today's daily drills as a plan: for each one, how to do it, which games
// count, the one game to open, and which drill is up next. Shared by the
// drills list (MissionsScreen), Home's widget and the "drill done" toast,
// so all three always agree on what comes next.

import { useMemo } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { useAccess } from '../../context/AccessContext';
import { drillHow, gamesForDrill } from './drills';

const isDone = (m) => m.status === 'completed' || m.status === 'claimed';

export function planDrills(missions = [], games = []) {
  const list = missions.map(m => {
    const matching = gamesForDrill(m.criteria, games);
    return {
      ...m,
      done: isDone(m),
      how: drillHow(m.criteria, m.target, games),
      games: matching,
      // The game to open for it: the first that counts. For an "any game"
      // drill that's simply the first game on the shelf.
      playGameId: matching[0]?.id || null,
    };
  });
  // Up next: the unfinished drill with the fewest left to go, so the nudge
  // is always towards the quickest win (on a fresh day, the smallest one).
  const left = (d) => (d.target || 1) - (d.progress || 0);
  const open = list.filter(d => !d.done);
  const next = open.sort((a, b) => left(a) - left(b))[0] || null;
  return {
    drills: list.map(d => ({ ...d, upNext: !!next && d.id === next.id })),
    next,
    doneCount: list.filter(d => d.done).length,
    total: list.length,
  };
}

export default function useDrillPlan() {
  const { dailyMissions } = useUserProgress();
  const { playableGames } = useAccess();
  return useMemo(() => planDrills(dailyMissions || [], playableGames || []), [dailyMissions, playableGames]);
}
