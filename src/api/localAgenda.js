// src/api/localAgenda.js
// The Planner's store on the phone, for guests: one list of rows in
// @cth_local_agenda (the operations are src/logic/agendaRows.js).
// plannerService.js sends a guest's reads and writes here; nothing else
// should need to.
//
// Writes run one at a time, so ticking two items quickly can't have the
// second save overwrite the first.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { selectRows, insertRows, updateRow, deleteRows, seriesFrom } from '../logic/agendaRows';

export const LOCAL_AGENDA_KEY = '@cth_local_agenda';

async function read() {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_AGENDA_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

let queue = Promise.resolve();
function change(fn) {
  const run = queue.then(async () => {
    const rows = await read();
    const { rows: next, result } = fn(rows);
    if (next !== rows) await AsyncStorage.setItem(LOCAL_AGENDA_KEY, JSON.stringify(next));
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export async function localSelect(query) { return selectRows(await read(), query); }
export async function localAll() { return read(); }
export async function localSeriesFrom(instance) { return seriesFrom(await read(), instance); }

export function localInsert(list) {
  return change(rows => { const { rows: next, added } = insertRows(rows, list); return { rows: next, result: added }; });
}

export function localUpdate(id, patch) {
  return change(rows => {
    const { rows: next, row } = updateRow(rows, id, patch);
    if (!row) throw new Error('That plan is no longer on this phone.');
    return { rows: next, result: row };
  });
}

export function localDelete(ids) {
  return change(rows => ({ rows: deleteRows(rows, ids), result: null }));
}
