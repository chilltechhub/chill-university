// src/api/supabaseClient.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Optionally import @env if you configured react-native-dotenv
// import { EXPO_PUBLIC_SUPABASE_URL as DOTENV_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY as DOTENV_KEY } from '@env';

console.log('--- ENV SOURCES DEBUG ---');
console.log('process.env.EXPO_PUBLIC_SUPABASE_URL =>', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =>', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('Constants.expoConfig?.extra =>', Constants.expoConfig?.extra);

const fromConstants = {
  url: Constants.expoConfig?.extra?.SUPABASE_URL ?? Constants.manifest?.extra?.SUPABASE_URL,
  key: Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ?? Constants.manifest?.extra?.SUPABASE_ANON_KEY,
};

const fromProcessEnv = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  key: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

// const fromDotenv = { url: DOTENV_URL, key: DOTENV_KEY }; // uncomment if using @env

// Choose the first valid source
const SUPABASE_URL =
  fromConstants.url ||
  fromProcessEnv.url /* || fromDotenv.url */ ;

const SUPABASE_ANON_KEY =
  fromConstants.key ||
  fromProcessEnv.key /* || fromDotenv.key */ ;

console.log('Resolved SUPABASE_URL =>', !!SUPABASE_URL);
console.log('Resolved SUPABASE_ANON_KEY =>', !!SUPABASE_ANON_KEY);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase config missing. Check app.config.js/.env/EAS dev client. Values found:', {
    fromConstants,
    fromProcessEnv,
    // fromDotenv
  });
  throw new Error('Supabase URL or anon key is missing! See logs for sources.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
