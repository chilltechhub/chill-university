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