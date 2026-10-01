// src/logic/useOnScreen.js
// True while the screen this component sits in is the one in front and the
// app isn't in the background. For animation timers that have no reason to
// run where nobody can see them.
//
// Tabs stay mounted after their first visit, so Training's walking
// character and pet (CharacterWalker, AnimatedSprite) kept ticking all
// session behind Home and Library: an 8 fps state update per sprite plus
// the pet's wander and coin timers, on the JS thread, for nothing.
//
// Same focus rules as React Navigation's useIsFocused (a nested screen
// blurs when its tab does), but it doesn't throw outside a screen: the tour
// guide renders above the navigator, where there's no screen to follow, so
// it just counts as on screen there.

import { useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { NavigationContext } from '@react-navigation/native';

export default function useOnScreen() {
  const navigation = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => (navigation ? navigation.isFocused() : true));
  const [appActive, setAppActive] = useState(AppState.currentState !== 'background');

  useEffect(() => {
    if (!navigation) return undefined;
    setFocused(navigation.isFocused());
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => { offFocus(); offBlur(); };
  }, [navigation]);

  useEffect(() => {
    // 'inactive' (iOS Control Center, an incoming call banner) still shows
    // the app, so only 'background' pauses.
    const sub = AppState.addEventListener('change', (s) => setAppActive(s !== 'background'));
    return () => sub.remove();
  }, []);

  return focused && appActive;
}
