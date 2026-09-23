// src/logic/confirm.js
// A yes/no question that works everywhere. Alert.alert with buttons does
// nothing on react-native-web, so every "Are you sure?" built on it (sign
// out, remove a profile, remove a PIN) silently never fired in the browser.
//
//   if (await confirmAsync('Sign out?', 'You can sign back in any time.', 'Sign out')) { ... }
import { Alert, Platform } from 'react-native';

export function confirmAsync(title, message = '', confirmText = 'OK', { destructive = true } = {}) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise(resolve => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

// A message with one OK button: Alert on phones, window.alert on web.
export function notify(title, message = '') {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
