// src/logic/errorReporting.js
// The one place a caught error goes, so crash reporting has a single door.
//
// Today it only writes to the console, which a store build throws away. When
// Sentry is set up (docs/audit-plan-2026-09-30.md, 1.2) it plugs in here and
// every caller starts reporting without changing.
//
// Nothing personal goes out with a report: the error, where it happened, and
// nothing else. No emails, names, birth dates or anything the person wrote.

let sink = null;

// Sentry (or anything else) registers itself here once, at startup.
export function setErrorSink(fn) {
  sink = typeof fn === 'function' ? fn : null;
}

// `where` is a short label for the place it happened ('ErrorBoundary',
// 'dataExport'); `extra` is for non-personal details (a route name, a table).
export function reportError(error, where, extra) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(`[${where || 'error'}]`, err, extra || '');
  if (sink) {
    try { sink(err, { where, ...extra }); } catch { /* reporting must never throw */ }
  }
}
