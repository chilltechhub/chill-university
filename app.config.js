// app.config.js
import 'dotenv/config';
export default ({ config }) => {
  return {
    ...config,
    owner: "chetowhite",
    plugins: [
      ...(config.plugins || []),
      'expo-secure-store',
      'expo-notifications',
      'expo-screen-orientation',
      // Required as of SDK 57 — expo install --fix can't write these into a
      // dynamic (app.config.js) config automatically, so they're added here.
      'expo-asset',
      'expo-font',
      'expo-status-bar',
      // Share INTO the app: "Chill" shows in the phone's share sheet for
      // links and text, which land in the Notification Center to be filed
      // (src/components/ShareIntentListener.js). Needs a dev/store build —
      // Expo Go can't carry a share extension, and the app simply skips it
      // there. Relies on `scheme` in app.json. The iOS extension gets its
      // own bundle id (…chillapp.share-extension) and an app group; EAS asks
      // to set those up on the next build.
      [
        'expo-share-intent',
        {
          iosActivationRules: {
            NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            NSExtensionActivationSupportsText: true,
          },
          androidIntentFilters: ['text/*'],
        },
      ],
      // Replaces the old top-level `splash` key in app.json, removed as of
      // SDK 57 — same image/color/resizeMode as before, just as a plugin.
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
    ],
    extra: {
      ...config.extra,
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
};