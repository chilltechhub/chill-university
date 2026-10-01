// src/logic/useAppActive.js
// True while the app is open on screen; false once it goes to the
// background (home screen, another app, a locked phone, a hidden browser
// tab on web).
//
// The pet, the character sprites and the pet's coin finding all run on this,
// not on which tab is in front: being in the app at all is what the coins
// reward, and the pet keeps going behind Home and Library. What stops them is
// leaving the app, where nobody is "on the app" and timers would only run
// for nothing (or not at all, once the phone suspends it).
//
// 'inactive' (iOS Control Center, a call banner over the app) still counts as
// open.

import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function useAppActive() {
  const [active, setActive] = useState(AppState.currentState !== 'background');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s !== 'background'));
    return () => sub.remove();
  }, []);
  return active;
}
