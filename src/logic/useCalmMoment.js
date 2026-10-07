// src/logic/useCalmMoment.js
// When a celebration may open: something is waiting to be shown, it has
// been waiting long enough for anything earned in the same moment to arrive
// too (so it can go on the same card), and the person isn't typing.
//
// Both rules come from a walkthrough on 2026-10-07. Claiming one goal opened
// "Level Up!", then "Unlocked!", then a stage card, each a beat after the
// last. And a stage card that arrived while a note was half typed took the
// keyboard with it, and the note was lost.

import { useEffect, useState } from 'react';
import { Platform, TextInput } from 'react-native';

const SETTLE_MS = 1500;
const RECHECK_MS = 700;

export function isTyping() {
  try {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const el = document.activeElement;
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      return tag === 'textarea' || el.isContentEditable
        || (tag === 'input' && !['button', 'checkbox', 'radio', 'submit', 'range'].includes(el.type));
    }
    const State = TextInput.State;
    const focused = State?.currentlyFocusedInput?.() ?? State?.currentlyFocusedField?.();
    return focused != null;
  } catch {
    return false;
  }
}

/** True once `pending` has held for a moment and nobody is typing. */
export default function useCalmMoment(pending) {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    if (!pending) { setCalm(false); return undefined; }
    let timer = null;
    const check = () => {
      if (isTyping()) { timer = setTimeout(check, RECHECK_MS); return; }
      setCalm(true);
    };
    timer = setTimeout(check, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [pending]);
  return pending && calm;
}
