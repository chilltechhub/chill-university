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

// `radius` is the target's own corner radius, passed through to the overlay
// so the spotlight traces the element's real shape instead of boxing
// everything identically. Pass the same value the wrapped element uses:
// r.full (or any large number) for a pill or circle, r.lg for a card, 0 for
// a plain row. Left unset it falls back to r.md in TourOverlay, which is
// right for most cards and wrong for nothing badly.
export default function TourSpot({ id, style, radius, children }) {
  const ref = useRef(null);
  const { registerTarget, unregisterTarget, active, currentStep } = useTour();

  // The last rect handed to the overlay, so a re-measure that finds the
  // element exactly where it was doesn't re-render the overlay.
  const lastRect = useRef(null);
  // Read inside measure() without making it a dependency.
  const isCurrentRef = useRef(false);
  isCurrentRef.current = active && currentStep?.id === id;

  const measure = useCallback(() => {
    // A frame late so the native node is definitely laid out — measuring
    // synchronously inside onLayout can occasionally return a stale rect.
    requestAnimationFrame(() => {
      ref.current?.measureInWindow?.((x, y, width, height) => {
        if (!(width > 0 && height > 0)) {
          // Nothing to measure: this screen is mounted but not on show (a
          // tab left behind, a page of the game feed). Drop the old rect
          // rather than let the overlay keep drawing a spotlight around
          // where this used to be on a screen the user isn't looking at.
          if (isCurrentRef.current && lastRect.current) {
            lastRect.current = null;
            unregisterTarget(id);
          }
          return;
        }
        const prev = lastRect.current;
        const same = prev && Math.abs(prev.x - x) < 1 && Math.abs(prev.y - y) < 1
          && Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1;
        if (same) return;
        lastRect.current = { x, y, width, height };
        registerTarget(id, { x, y, width, height, radius });
      });
    });
  }, [id, registerTarget, unregisterTarget, radius]);

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

  // While this spot IS the highlighted one, keep checking where it is.
  // onLayout fires once and never again for a scroll, so anything that
  // moves under a running tour — the game feed paging between games, a
  // list settling, an image or font landing, the keyboard opening — left
  // the spotlight drawn around wherever the element used to be. Cheap: a
  // measure every 400ms that only re-registers when the rect really moved.
  //
  // On web it also re-centres the spot if it has drifted out of view. The
  // one scrollIntoView at step start can run before the cards above it have
  // loaded; they then push it down, and the first goal's Finish button ended
  // up under the tab bar with the dim blocking the scroll that would reveal
  // it. Native has no scrollIntoView, same as above.
  useEffect(() => {
    if (!active || currentStep?.id !== id) return undefined;
    const t = setInterval(() => {
      const node = ref.current;
      if (typeof node?.scrollIntoView === 'function' && typeof node.getBoundingClientRect === 'function'
          && typeof window !== 'undefined') {
        const r = node.getBoundingClientRect();
        const clearTop = 56;                      // top bar
        const clearBottom = window.innerHeight - 64; // tab bar
        const fits = r.height <= clearBottom - clearTop;
        if (r.height > 0 && fits && (r.top < clearTop || r.bottom > clearBottom)) {
          node.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      }
      measure();
    }, 400);
    return () => clearInterval(t);
  }, [active, currentStep?.id, id, measure]);

  return (
    <View ref={ref} onLayout={measure} style={style} collapsable={false}>
      {children}
    </View>
  );
}
