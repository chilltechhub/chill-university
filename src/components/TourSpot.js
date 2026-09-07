// src/components/TourSpot.js
// Wrap any real UI element with <TourSpot id="some-id"> to make it a
// possible target for the guided tour (context/TourContext.js) — it
// measures its own on-screen position and registers that rect under `id`.
// Renders its children unchanged otherwise; safe to leave in place even
// when the tour isn't running (registration is cheap and the overlay only
// reads it when that id is the current step).
//
// If this spot is the tour's CURRENT target and it's sitting inside a
// ScrollView below/above the visible viewport (e.g. Settings' "Family"
// row, far down the page), it wasn't getting a spotlight at all — the
// overlay's hole-box math went negative for an off-screen rect and just
// silently drew nothing, and nothing ever scrolled the page to bring it
// into view. `scrollIntoView` (a real DOM method on web, since RN-web
// forwards refs to the underlying element) fixes both: it brings the spot
// on-screen, then we re-measure so the overlay gets its real, positive,
// on-screen rect. Native has no such API — this is a no-op there, same
// as before this fix, not a regression.

import React, { useRef, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useTour } from '../../context/TourContext';

export default function TourSpot({ id, style, children }) {
  const ref = useRef(null);
  const { registerTarget, unregisterTarget, active, currentStep } = useTour();

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

  // Safety net for a screen tutorial (context/TourContext.js's
  // startScreenTour): it never navigates, so every TourSpot on the current
  // screen is already mounted and its one-time onLayout measurement may be
  // long past — including any position drift from the user having
  // scrolled since. Re-measuring right when the tour turns on catches
  // both without relying on a fresh layout event that may never come.
  useEffect(() => {
    if (!active) return;
    if (currentStep?.id === id && typeof ref.current?.scrollIntoView === 'function') {
      // 'center': 'start' pinned the target flush to the top of the
      // scrollable area, which on a tab screen means the bottom tab bar
      // (rendered outside/above the scroll content, always-on-top) can
      // end up covering it. 'center' keeps it clear of both the tooltip
      // card above and the tab bar below in the common case.
      ref.current.scrollIntoView({ block: 'center', behavior: 'auto' });
      // scrollIntoView doesn't resolve when the scroll is actually done —
      // even 'auto' (instant) behavior can still take a frame or two to
      // land here (react-native-web's ScrollView isn't a plain native
      // scroll container). One requestAnimationFrame measured mid-scroll
      // and registered a stale rect that happened to line up with a
      // different tile. A fixed short delay is crude but reliable — long
      // enough for any scroll this small to have actually finished.
      setTimeout(measure, 120);
    } else {
      measure();
    }
  }, [active, currentStep?.id, id, measure]);

  return (
    <View ref={ref} onLayout={measure} style={style} collapsable={false}>
      {children}
    </View>
  );
}
