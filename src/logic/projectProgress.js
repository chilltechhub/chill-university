// src/logic/projectProgress.js
// How far along a project is, as one number every screen agrees on.
//
// It used to be finished tasks ÷ all tasks, so a project with one task,
// done, said "100% built" while the work had barely started (2026-10-07).
// Now:
//   - only a project marked Done is 100%
//   - an open next action counts as work still to do
//   - short of Done it tops out at 95%, and `allTasksDone` lets a screen
//     say "all tasks done, mark it Done?" instead of claiming it's finished
// No tasks and no next action is still "no number" (null), as before.

export const NOT_DONE_CAP = 95;

/**
 * @param {{ total?: number, done?: number, status?: string, nextAction?: string|null }} p
 * @returns {{ pct: number|null, allTasksDone: boolean }}
 */
export function projectProgress({ total = 0, done = 0, status = 'active', nextAction = null } = {}) {
  if (status === 'completed') return { pct: 100, allTasksDone: true };
  const open = nextAction && String(nextAction).trim() ? 1 : 0;
  const steps = total + open;
  if (steps === 0) return { pct: null, allTasksDone: false };
  const raw = Math.round((done / steps) * 100);
  return { pct: Math.min(raw, NOT_DONE_CAP), allTasksDone: total > 0 && done >= total && !open };
}
