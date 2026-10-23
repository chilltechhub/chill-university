// src/logic/guide/guideState.js
// Two small shared bits of the guide (shake-up P7), each a value with
// listeners, so screens and the guide don't import each other:
//
//   Today's view   HomeScreen says which view Today is on (Day, Week,
//                  Month), so the guide knows today.week from today.day.
//   About this page  anything can ask for the sheet (the You footer, the top
//                  bar's menu); AboutPageSheet, mounted once in App.js,
//                  answers.

let todayView = 'Daily';
const viewListeners = new Set();

export function setTodayView(view) {
  if (!view || view === todayView) return;
  todayView = view;
  viewListeners.forEach(fn => { try { fn(view); } catch {} });
}
export const getTodayView = () => todayView;
export function onTodayView(fn) { viewListeners.add(fn); return () => viewListeners.delete(fn); }

const aboutListeners = new Set();
/** Opens "About this page" for `route` (with its params). */
export function openAboutPage(route, params = null) {
  aboutListeners.forEach(fn => { try { fn({ route, params }); } catch {} });
}
export function onAboutPage(fn) { aboutListeners.add(fn); return () => aboutListeners.delete(fn); }
