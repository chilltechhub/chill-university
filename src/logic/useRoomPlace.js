// src/logic/useRoomPlace.js
// Where your room shows: 'you' (default), 'today' or 'off'
// (docs/shake-up-plan-2026-10-21.md §5.2, P5). Stored as the synced setting
// ROOM_PLACE, so it follows the account across devices (prefsSync).
//
// A shared store rather than useSetting: the room's own ⋯, the editor, You,
// Today and Make it yours can all be mounted at once, and moving the room in
// one has to move it in all of them right away.

import { useEffect, useState } from 'react';
import { SETTING_KEYS, readSetting, writeSetting, peekSetting } from './useSetting';
import { onPrefsRestored } from './prefsSync';
import { roomPlaceOf } from './receipts';

const KEY = SETTING_KEYS.ROOM_PLACE;
const listeners = new Set();

export async function setRoomPlace(place) {
  const next = roomPlaceOf(place);
  listeners.forEach(fn => fn(next));
  await writeSetting(KEY, next);
}

export default function useRoomPlace() {
  const [place, setPlace] = useState(() => roomPlaceOf(peekSetting(KEY, 'you')));
  useEffect(() => {
    let alive = true;
    const read = () => readSetting(KEY, 'you').then(v => { if (alive) setPlace(roomPlaceOf(v)); });
    read();
    listeners.add(setPlace);
    const off = onPrefsRestored(read);
    return () => { alive = false; listeners.delete(setPlace); off(); };
  }, []);
  return [place, setRoomPlace];
}
