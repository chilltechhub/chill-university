// src/components/ShareIntentListener.js
// Catches a link or text shared into the app from the phone's share sheet
// (expo-share-intent, configured in app.config.js), parks it in the
// shared-items list (logic/shareIntake.js) and opens the Notification Center
// on it so it can be filed: saved, turned into a reminder, or planned with AI.
//
// The native module only exists in a dev or store build. In Expo Go and on
// web it's missing, the hook is told it's disabled, and this renders nothing
// — "Paste something in" on the center is the way in there.
//
// Rendered once inside the NavigationContainer (App.js) with the navigation
// ref, since it sits outside any navigator.

import { useEffect } from 'react';
import { useShareIntent, ShareIntentModule } from 'expo-share-intent';
import { addShared, splitShared } from '../logic/shareIntake';

const AVAILABLE = !!ShareIntentModule;

export default function ShareIntentListener({ navigationRef }) {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    disabled: !AVAILABLE,
    resetOnBackground: true,
  });

  useEffect(() => {
    if (!hasShareIntent) return;
    let cancelled = false;
    (async () => {
      const url = shareIntent.webUrl || null;
      const text = shareIntent.text && shareIntent.text !== url ? shareIntent.text : null;
      const item = await addShared(url ? { text, url } : splitShared(text));
      resetShareIntent();
      if (!item || cancelled) return;
      // A share can cold-start the app before navigation is ready.
      const go = (tries = 0) => {
        const nav = navigationRef?.current;
        if (nav?.isReady?.()) nav.navigate('Notifications', { tab: 'now', openShared: item.id });
        else if (tries < 20) setTimeout(() => go(tries + 1), 250);
      };
      go();
    })();
    return () => { cancelled = true; };
  }, [hasShareIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
