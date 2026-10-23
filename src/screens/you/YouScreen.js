// src/screens/you/YouScreen.js
// You: the dropdown from the top bar's avatar (docs/shake-up-plan-2026-10-21.md
// §2.2, P4). A root-stack route, not an RN Modal, so tours, search and
// back handling work as on any screen. App.js gives it a top-down slide;
// it sits under the top bar, so the avatar that opened it closes it too.
//
// The profile (ProfileScreen, or GuestYou for a guest) inside You's frame:
// search on top, the Dream, your four circles, receipts and shelf (P6), the
// room (P5), then the ground and the old crest menu's rows underneath.
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
import { openAboutPage } from '../../logic/guide/guideState';
import ProfileScreen from '../ProfileScreen';
import { YouHeader, YouSearch, YouGround, YouFooter, YouReceipts, YouShelf } from './YouParts';
import IkigaiCircles from '../../components/IkigaiCircles';
import Room, { RoomElsewhere } from '../../components/Room';
import useRoomPlace from '../../logic/useRoomPlace';

const ROOT_ROWS = {
  notifications: 'Notifications', workmode: 'WorkMode', insights: 'Stats',
  yours: 'MakeItYours', settings: 'Settings', organization: 'Organization',
};

export default function YouScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUserProgress();
  const { startTour } = useTour();
  const { openPalette } = useCommandPalette();
  // The page You was opened over (the avatar passes it), for "About this page".
  const from = route.params?.from || 'Home';
  // Your room, when it's placed here (shake-up P5); otherwise a line that
  // says where it is. Insights lands here with anchor 'receipts'.
  const [roomPlace] = useRoomPlace();
  const receiptsFirst = route.params?.anchor === 'receipts';

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
    // About this page (shake-up P7): the sheet for the page You was opened over.
    if (key === 'about') { closeThen(() => openAboutPage(from, route.params?.fromParams || null)); return; }
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
    room: roomPlace === 'you'
      ? <Room size={160} place="you" style={{ marginBottom: 12 }} />
      : <RoomElsewhere here="you" style={{ marginBottom: 12 }} />,
    // Your four circles, receipts, then your shelf (shake-up P6). Insights'
    // anchor puts this block first.
    receipts: (
      <>
        <IkigaiCircles onGo={(screen) => leave(() => goToScreen(navigation, screen))} />
        <YouReceipts userId={user?.id || null} onSeeAll={user ? () => leave(() => navigation.navigate('Stats')) : null} />
        <YouShelf onOpen={(screen, params) => leave(() => goToScreen(navigation, screen, params))} />
      </>
    ),
    receiptsFirst,
    bottom: (
      <>
        <YouGround onOpenArea={(areaId) => leave(() => goToScreen(navigation, 'LifeAreaScreen', { areaId }))}
          onOpenPath={() => leave(() => goToScreen(navigation, 'PathScreen'))} />
        <YouFooter signedIn={!!user} go={go} onClose={close} />
      </>
    ),
    leave,
  };
  return <ProfileScreen you={you} />;
}
