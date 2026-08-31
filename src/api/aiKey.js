// src/api/aiKey.js
// Storage for a user-supplied Anthropic API key ("bring your own key").
// This is the user's own key, entered by them in Settings, used only for
// their own requests — not the shared key behind supabase/functions/parse-import.
// SecureStore (Keychain/Keystore) on iOS/Android; SecureStore has no web
// implementation, so this falls back to AsyncStorage there.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cth_user_anthropic_key';

let SecureStore = null;
if (Platform.OS !== 'web') {
  // Lazy require — avoids touching a native module on web at all.
  SecureStore = require('expo-secure-store');
}

export async function getUserApiKey() {
  try {
    if (SecureStore) return (await SecureStore.getItemAsync(KEY)) || null;
    return (await AsyncStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export async function setUserApiKey(key) {
  const trimmed = (key || '').trim();
  if (SecureStore) return SecureStore.setItemAsync(KEY, trimmed);
  return AsyncStorage.setItem(KEY, trimmed);
}

export async function clearUserApiKey() {
  if (SecureStore) return SecureStore.deleteItemAsync(KEY).catch(() => {});
  return AsyncStorage.removeItem(KEY);
}

// Mask for display: sk-ant-...ab12
export function maskKey(key) {
  if (!key || key.length < 10) return '';
  return `${key.slice(0, 7)}···${key.slice(-4)}`;
}
