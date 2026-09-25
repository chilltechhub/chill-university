// src/components/WidgetBoard.js
// iOS-style "jiggle mode" board: pass it a full-width stack of `widgets` and
// a `layout` (order + hidden flags), and it renders them absolutely
// positioned by measured height (they're NOT uniform-height like iOS's own
// grid, so position has to come from real layout, not an index * cellSize
// guess). When `editing` is true every widget wobbles, gets a red "–" to
// hide it, and can be dragged by its handle to reorder — hidden ones drop
// into a tray below with a "+" to bring back. This component is fully
// controlled: it never persists anything itself, it just calls
// `onChangeLayout(nextLayout)` — see HomeScreen.js for the Supabase side.
//
// First use of react-native-gesture-handler / react-native-reanimated in
// this codebase (both were already dependencies, just unused). The pan
// gesture runs its callbacks on the JS thread (`.runOnJS(true)`) rather than
// as UI-thread worklets — a little less silky than a fully worklet-driven
// drag, but it means the reorder math below is plain, debuggable JS (refs
// work normally, no worklet/JS-thread memory-model gotchas) while the
// actual on-screen motion is still driven by Reanimated shared values, so
// it stays smooth.
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, withDelay, cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Eyebrow } from './ui';
import TourSpot from './TourSpot';

const JIGGLE_DEG = 1.4;
const JIGGLE_MS = 130;
const SPRING = { damping: 18, stiffness: 180 };

// One widget's position/rotation is driven entirely by Reanimated shared
// values so dragging and the jiggle wobble both stay off the JS thread for
// rendering, even though the drag GESTURE itself is JS-thread (see above).
function DraggableWidget({ widgetKey, index, y, editing, offsetsRef, onSwap, onLayoutHeight, onHide, children, c, t, s, r }) {
  const translateY = useSharedValue(0);
  const rot = useSharedValue(0);
  const [dragging, setDragging] = useState(false);

  const baseOffsetRef = useRef(y);
  const lastIndexRef  = useRef(index);
  const prevYRef      = useRef(y);

  useEffect(() => { lastIndexRef.current = index; }, [index]);

  // Slide smoothly into a new slot when a SIBLING's drag bumps this widget
  // down/up the list — not when THIS widget is the one being dragged (that
  // one tracks the finger directly, below).
  useEffect(() => {
    if (!dragging && prevYRef.current !== y) {
      translateY.value = prevYRef.current - y; // land exactly where it visually was...
      translateY.value = withSpring(0, SPRING); // ...then slide the rest of the way.
    }
    prevYRef.current = y;
  }, [y, dragging]);

  // Jiggle, staggered a little per row so the whole board doesn't wobble
  // in unison — closer to how iOS icons actually look.
  useEffect(() => {
    if (editing) {
      rot.value = withDelay((index % 4) * 70, withRepeat(
        withSequence(
          withTiming(-JIGGLE_DEG, { duration: JIGGLE_MS }),
          withTiming(JIGGLE_DEG, { duration: JIGGLE_MS * 2 }),
          withTiming(0, { duration: JIGGLE_MS }),
        ),
        -1, true,
      ));
    } else {
      cancelAnimation(rot);
      rot.value = withTiming(0, { duration: 100 });
    }
  }, [editing]);

  // Counts how many OTHER visible widgets currently have their center above
  // this one's live center — that count IS this widget's correct insertion
  // index, regardless of how tall any of them are.
  const handleDragUpdate = useCallback((ty) => {
    const { order, tops, heights } = offsetsRef.current;
    const myHeight = heights[widgetKey] || 80;
    const myCenter = baseOffsetRef.current + ty + myHeight / 2;
    let count = 0;
    for (const k of order) {
      if (k === widgetKey) continue;
      const otherCenter = (tops[k] || 0) + (heights[k] || 80) / 2;
      if (otherCenter < myCenter) count++;
    }
    if (count !== lastIndexRef.current) {
      lastIndexRef.current = count;
      onSwap(widgetKey, count);
    }
  }, [widgetKey, onSwap, offsetsRef]);

  const pan = Gesture.Pan()
    .enabled(editing)
    .runOnJS(true)
    .onStart(() => {
      setDragging(true);
      baseOffsetRef.current = offsetsRef.current.tops[widgetKey] ?? y;
      lastIndexRef.current = index;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
      handleDragUpdate(e.translationY);
    })
    .onEnd(() => {
      translateY.value = withSpring(0, SPRING);
      setDragging(false);
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rot.value}deg` }],
  }));

  return (
    <View
      onLayout={(e) => onLayoutHeight(widgetKey, Math.round(e.nativeEvent.layout.height))}
      style={{ position: 'absolute', left: 0, right: 0, top: dragging ? baseOffsetRef.current : y, zIndex: dragging ? 100 : 1 }}
    >
      <Animated.View style={[aStyle, dragging && { shadowColor: '#000' /* style-ok: drop shadow is black in both modes */, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 }]}>
        {children}
        {editing && (
          <>
            <TouchableOpacity onPress={onHide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ position: 'absolute', top: -6, left: s.lg - 6, width: 22, height: 22, borderRadius: 11, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: c.bg0, zIndex: 5 }}>
              <Ionicons name="remove" size={14} color="#ffffff" /> {/* style-ok: white on the red remove badge */}
            </TouchableOpacity>
            <GestureDetector gesture={pan}>
              <View
                style={{ position: 'absolute', top: -6, right: s.lg - 6, width: 26, height: 26, borderRadius: 13, backgroundColor: c.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, zIndex: 5 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="reorder-three" size={16} color={c.text3} />
              </View>
            </GestureDetector>
          </>
        )}
      </Animated.View>
    </View>
  );
}

export default function WidgetBoard({ layout, widgets, editing, onChangeLayout, c, t, s, r }) {
  const widgetMap = useMemo(() => Object.fromEntries(widgets.map(w => [w.key, w])), [widgets]);
  const visible = useMemo(() => layout.filter(l => !l.hidden && widgetMap[l.key]), [layout, widgetMap]);
  const hidden  = useMemo(() => layout.filter(l => l.hidden && widgetMap[l.key]), [layout, widgetMap]);

  const [heights, setHeights] = useState({});
  const GAP = s.lg;

  const { tops, total } = useMemo(() => {
    let y = 0; const map = {};
    visible.forEach(({ key }) => { map[key] = y; y += (heights[key] || 80) + GAP; });
    return { tops: map, total: Math.max(0, y - GAP) };
  }, [visible, heights, GAP]);

  const layoutRef = useRef(layout); layoutRef.current = layout;
  const offsetsRef = useRef({ order: [], tops: {}, heights: {} });
  offsetsRef.current = { order: visible.map(v => v.key), tops, heights };

  const handleLayoutHeight = useCallback((key, h) => {
    setHeights(prev => (prev[key] === h ? prev : { ...prev, [key]: h }));
  }, []);

  const handleToggleHidden = useCallback((key) => {
    onChangeLayout(layoutRef.current.map(l => (l.key === key ? { ...l, hidden: !l.hidden } : l)));
  }, [onChangeLayout]);

  // Fired as a dragged widget's center crosses a neighbor's — moves it to
  // `toIndex` among the visible keys; hidden widgets keep their existing
  // relative order, tucked in after.
  const handleSwap = useCallback((key, toIndex) => {
    const cur = layoutRef.current;
    const visibleKeys = cur.filter(l => !l.hidden).map(l => l.key);
    const fromIndex = visibleKeys.indexOf(key);
    if (fromIndex === -1 || fromIndex === toIndex) return;
    visibleKeys.splice(fromIndex, 1);
    visibleKeys.splice(toIndex, 0, key);
    const hiddenEntries = cur.filter(l => l.hidden);
    onChangeLayout([...visibleKeys.map(k => ({ key: k, hidden: false })), ...hiddenEntries]);
  }, [onChangeLayout]);

  return (
    <View>
      <View style={{ height: total }}>
        {visible.map(({ key }, index) => {
          const widget = widgetMap[key];
          return (
            <DraggableWidget
              key={key} widgetKey={key} index={index} y={tops[key] || 0}
              editing={editing} offsetsRef={offsetsRef}
              onSwap={handleSwap} onLayoutHeight={handleLayoutHeight} onHide={() => handleToggleHidden(key)}
              c={c} t={t} s={s} r={r}
            >
              {/* So a widget that has just arrived on Home can be pointed at
                  and explained (HomeScreen's "new on Home" note). */}
              <TourSpot id={`widget-${key}`}>
                {widget.render()}
              </TourSpot>
            </DraggableWidget>
          );
        })}
      </View>

      {editing && hidden.length > 0 && (
        <View style={{ paddingHorizontal: s.lg, marginTop: s.md }}>
          <Eyebrow style={{ marginBottom: s.sm }}>Hidden widgets</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
            {hidden.map(({ key }) => (
              <TouchableOpacity key={key} onPress={() => handleToggleHidden(key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.bg1, borderRadius: r.full, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' }}>
                <Ionicons name="add-circle" size={16} color={c.teal} />
                <Text style={{ fontSize: t.xs, color: c.text2, fontWeight: '600' }}>{widgetMap[key].title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
