// app.config.js
import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      // map the EXPO_PUBLIC_ env vars into expoConfig.extra with these exact keys
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  };
};
