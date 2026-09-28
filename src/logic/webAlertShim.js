// src/logic/webAlertShim.js
// Alert.alert does nothing on react-native-web, so every confirm built on it
// (delete, report, block, unlink, remove member, take down…) silently never
// fired in the browser, and its error and success messages were never seen.
// Web is only for testing, so rather than convert every call site this maps
// Alert.alert onto the browser's own dialogs, once, at startup (App.js).
// Phones never run it. confirm.js's confirmAsync / notify already handle
// web themselves and are unaffected.
import { Alert, Platform } from 'react-native';

const isCancel = (b) => b.style === 'cancel' || /^(cancel|not now|no)$/i.test(String(b.text || '').trim());

export function installWebAlertShim() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || Alert.__webShim) return;

  Alert.alert = (title, message, buttons, options) => {
    const list = Array.isArray(buttons) ? buttons.filter(Boolean) : [];
    const cancel = list.find(isCancel);
    const actions = list.filter(b => b !== cancel);
    const body = message ? `${title}\n\n${message}` : String(title ?? '');
    const dismiss = () => { cancel?.onPress?.(); options?.onDismiss?.(); };

    // Deferred, like the native dialog: callers don't expect a button's
    // onPress to run before Alert.alert returns.
    setTimeout(() => {
      if (!cancel && actions.length <= 1) {
        window.alert(body);
        actions[0]?.onPress?.();
      } else if (actions.length === 1) {
        if (window.confirm(body)) actions[0].onPress?.();
        else dismiss();
      } else {
        // Two or more real choices: the browser has no dialog for that, so
        // it asks for a number.
        const menu = actions.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
        const pick = window.prompt(`${body}\n\n${menu}\n\nType a number.`);
        const chosen = actions[Number(pick) - 1];
        if (chosen) chosen.onPress?.();
        else dismiss();
      }
    }, 0);
  };
  Alert.__webShim = true;
}
