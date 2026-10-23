// src/screens/you/YouScreen.js
// You: the dropdown from the top bar's avatar (docs/shake-up-plan-2026-10-21.md
// §2.2, P4). A root-stack route, not an RN Modal, so tours, search and
// back handling work as on any screen. App.js gives it a top-down slide;
// it sits under the top bar, so the avatar that opened it closes it too.
//
// Until the ikigai, receipts and room arrive (P5/P6) it's the profile
// (ProfileScreen, or GuestYou for a guest) inside You's frame: search on
// top, your life areas and the old crest menu's rows underneath.
//
// Closes by: the chevron (top and bottom), the avatar, Esc on web, Android
// back, a swipe up, or picking anything inside it.

import React, { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { useTour } from '../../../context/TourContext';
import { useCommandPalette } from '../../../context/CommandPaletteContext';
import { useUserProgress } from '../../../context/UserProgressContext';
import { goToScreen } from '../../logic/appRoutes';
import { showWhatsNext } from '../../logic/useGuidedFirstGoal';
import ProfileScreen from '../ProfileScreen';
import { YouHeader, YouSearch, YouGround, YouFooter } from './YouParts';

const ROOT_ROWS = {
  notifications: 'Notifications', workmode: 'WorkMode', insights: 'Stats',
  yours: 'MakeItYours', settings: 'Settings', organization: 'Organization',
};

export default function YouScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUserProgress();
  const { startTour, startScreenTour } = useTour();
  const { openPalette } = useCommandPalette();
  // The page You was opened over (the avatar passes it), for "About this page".
  const from = route.params?.from || 'Home';

  const close = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else goToScreen(navigation, 'Home');
  }, [navigation]);

  // Go somewhere, then take You off the stack underneath it. In that order:
  // a jump from a screen already removed loses its params. A tab jump has
  // popped You already.
  const leave = useCallback((go) => {
    const key = route.key;
    go();
    setTimeout(() => {
      const state = navigation.getState?.();
      if (!state?.routes?.some(r => r.key === key)) return;
      const routes = state.routes.filter(r => r.key !== key);
      navigation.dispatch(CommonActions.reset({ ...state, routes, index: routes.length - 1 }));
    }, 0);
  }, [navigation, route.key]);

  // After closing, for the rows that act on the app rather than open a page.
  const closeThen = useCallback((fn, wait = 350) => { close(); setTimeout(fn, wait); }, [close]);

  const go = (key) => {
    if (ROOT_ROWS[key]) { leave(() => navigation.navigate(ROOT_ROWS[key])); return; }
    if (key === 'help') { leave(() => navigation.navigate('Help', { fromScreen: from })); return; }
    if (key === 'next') { closeThen(showWhatsNext); return; }
    if (key === 'about') { closeThen(() => startScreenTour(from)); return; }
    if (key === 'tour') closeThen(startTour);
  };

  // Esc closes it on web, like any dropdown.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  const you = {
    header: <YouHeader onClose={close} />,
    top: <YouSearch onOpen={openPalette} />,
    bottom: (
      <>
        <YouGround onOpenArea={(areaId) => leave(() => goToScreen(navigation, 'LifeAreaScreen', { areaId }))} />
        <YouFooter signedIn={!!user} go={go} onClose={close} />
      </>
    ),
    leave,
  };
  return <ProfileScreen you={you} />;
}
