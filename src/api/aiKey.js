// src/api/aiKey.js
// AI Import let someone save their own Anthropic API key on the device.
// It was folded into Fill with AI on 2026-10-16 (free, works with any
// chatbot), so nothing reads the key any more. Signing out still wipes one
// an older version saved (src/logic/localUserData.js).
// SecureStore (Keychain/Keystore) on iOS/Android; AsyncStorage on web.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'cth_user_anthropic_key';

let SecureStore = null;
if (Platform.OS !== 'web') {
  // Lazy require — avoids touching a native module on web at all.
  SecureStore = require('expo-secure-store');
}

export async function clearUserApiKey() {
  if (SecureStore) return SecureStore.deleteItemAsync(KEY).catch(() => {});
  return AsyncStorage.removeItem(KEY);
}
