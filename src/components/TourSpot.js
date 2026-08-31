// src/components/TourSpot.js
// Wrap any real UI element with <TourSpot id="some-id"> to make it a
// possible target for the guided tour (context/TourContext.js) — it
// measures its own on-screen position and registers that rect under `id`.
// Renders its children unchanged otherwise; safe to leave in place even
// when the tour isn't running (registration is cheap and the overlay only
// reads it when that id is the current step).

import React, { useRef, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useTour } from '../../context/TourContext';

export default function TourSpot({ id, style, children }) {
  const ref = useRef(null);
  const { registerTarget, unregisterTarget } = useTour();

  const measure = useCallback(() => {
    // A frame late so the native node is definitely laid out — measuring
    // synchronously inside onLayout can occasionally return a stale rect.
    requestAnimationFrame(() => {
      ref.current?.measureInWindow?.((x, y, width, height) => {
        if (width > 0 && height > 0) registerTarget(id, { x, y, width, height });
      });
    });
  }, [id, registerTarget]);

  useEffect(() => () => unregisterTarget(id), [id, unregisterTarget]);

  return (
    <View ref={ref} onLayout={measure} style={style} collapsable={false}>
      {children}
    </View>
  );
}
