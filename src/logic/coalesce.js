// src/logic/coalesce.js
// Many calls in a burst become one run, `wait` ms after the last of them,
// and two runs never overlap: a call that lands while one is running gets
// one more run after it. The latest arguments win.
//
// The phone-calendar copy (src/api/phoneCalendar.js) ran after every tick
// and edit in the Planner; a few quick changes started several full syncs
// at once. No imports, so scripts/check-planner.mjs runs it.

export function coalesce(run, wait = 1500) {
  let timer = null;
  let running = null;
  let again = false;
  let lastArgs = [];
  const fire = () => {
    timer = null;
    if (running) { again = true; return; }
    running = Promise.resolve()
      .then(() => run(...lastArgs))
      .catch(() => {})
      .finally(() => {
        running = null;
        if (again) { again = false; schedule(); }
      });
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(fire, wait);
  };
  return (...args) => { lastArgs = args; schedule(); };
}
