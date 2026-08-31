// app.config.js
import 'dotenv/config';
export default ({ config }) => {
  return {
    ...config,
    owner: "chetowhite",
    plugins: [...(config.plugins || []), 'expo-secure-store', 'expo-notifications', 'expo-screen-orientation'],
    extra: {
      ...config.extra,
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
};