// src/components/DecorateSheet.js (opened from Profile, beside Customize)
// Decorate a scene: add items from the tray, drag them where you want them,
// and flip, resize, bring to front or remove the one you picked. The pet's
// bowl can be dragged along the ground too. Arrow buttons nudge the picked
// item for anyone who can't drag. Save keeps the layout for this scene only
// (stageDecor.js); Reset goes back to the scene's own items.
//
// Items unlock by level (sceneArt.js DECOR). Locked ones show in the tray
// with the level they open at, so there's something to look forward to.
// Trophies open from the Studio instead: master every part of a Build and
// its trophy is yours to place (src/logic/studio.js).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import LandscapeBackground from './LandscapeBackground';
import PixelArt from './PixelArt';
import { ART, DECOR, DECOR_GROUPS, decorById } from '../data/sceneArt';
import {
  seedLayout, groundFor, decorAllowed, trophyEarned, clamp, MAX_DECOR, SCALE_MIN, SCALE_MAX, DEFAULT_BOWL_X,
} from '../logic/stageDecor';
import { FONTS } from '../theme';

const STAGE_H = 200;   // the room and tile scenes; full scenes keep their 16:9
const NUDGE = 0.02;    // one arrow tap, as a fraction of the stage
const TILE = 44;       // tray thumbnail box
// The walker draws the bowl 0.55 of a 42px pet wide on a 150px stage: as a
// prop scale (relative to a 300px stage, bowl art 43px wide), about 1.07.
const BOWL_SCALE = ((0.55 * 42) / 150) * (300 / 43);

// One placed item (or the bowl), draggable. The latest props live in a ref
// so the responder, made once, always moves the right thing.
function Draggable({ art, flip, x, y, scale, box, ground, picked, lockY, label, color, onPick, onMove }) {
  const a = ART[art];
  const k = (box.height / 300) * scale;
  const w = a.w * k;
  const h = a.h * k;
  const latest = useRef(null);
  latest.current = { x, y, h, box, ground, lockY, onPick, onMove };
  const start = useRef({ x: 0, y: 0 });
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      const L = latest.current;
      start.current = { x: L.x, y: L.y };
      L.onPick();
    },
    onPanResponderMove: (_, g) => {
      const L = latest.current;
      const W = L.box.width;
      const H = L.box.height;
      const nx = clamp(start.current.x + g.dx / W, 0, 1);
      const ny = L.lockY ? L.y : clamp(start.current.y - g.dy / H, -L.ground / H, 1 - (L.h + L.ground) / H);
      L.onMove(nx, ny);
    },
  })).current;

  return (
    <View
      {...pan.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${label}. Drag to move`}
      accessibilityState={{ selected: picked }}
      style={{
        position: 'absolute', left: x * box.width - w / 2, bottom: ground + y * box.height, width: w, height: h,
        borderWidth: picked ? 1.5 : 0, borderColor: color, borderStyle: 'dashed', borderRadius: 3,
      }}
    >
      <PixelArt art={a} scale={k} flip={flip} />
    </View>
  );
}

export default function DecorateSheet({ visible, onClose, background, level = 1, decor, onSave, pet }) {
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const s = useMemo(() => makeStyles(c, t, sp, r), [c, t, sp, r]);
  const [items, setItems] = useState([]);
  const [bowlX, setBowlX] = useState(DEFAULT_BOWL_X);
  const [picked, setPicked] = useState(null);   // an item's index, or 'bowl'
  // Trophies first once they have one; Furniture until then.
  const [group, setGroup] = useState(() => (DECOR.some(d => d.build && trophyEarned(d.id)) ? 'Trophies' : 'Furniture'));
  const [box, setBox] = useState(null);
  const [note, setNote] = useState(null);

  // Each time it opens: the saved layout, or the scene's own items.
  useEffect(() => {
    if (!visible || !background) return;
    const start = decor?.items ? decor : seedLayout(background, level);
    setItems(start.items.filter(it => ART[it.art]).map(it => ({ ...it })));
    setBowlX(start.bowlX ?? DEFAULT_BOWL_X);
    setPicked(null);
    setNote(null);
    // Only on opening (or switching scene): not on every save upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, background?.id]);

  if (!background) return null;
  const ground = groundFor(background);
  const item = typeof picked === 'number' ? items[picked] : null;
  const nameOf = (art) => decorById(art)?.name || 'Item';

  const update = (i, patch) => setItems(list => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const add = (d) => {
    if (items.length >= MAX_DECOR) { setNote(['Full. ', 'Remove', ' something first.']); return; }
    setItems(list => [...list, { art: d.id, x: 0.5, y: d.wall ? 0.45 : 0, scale: d.scale, flip: false }]);
    setPicked(items.length);
    setNote(null);
  };
  const nudge = (dx, dy) => {
    if (picked === 'bowl') { setBowlX(v => clamp(v + dx, 0, 1)); return; }
    if (!item) return;
    update(picked, { x: clamp(item.x + dx, 0, 1), y: clamp(item.y + dy, -0.08, 0.95) });
  };
  const resize = (f) => item && update(picked, { scale: clamp(+(item.scale * f).toFixed(2), SCALE_MIN, SCALE_MAX) });
  const toFront = () => {
    if (!item) return;
    setItems(list => [...list.filter((_, j) => j !== picked), item]);
    setPicked(items.length - 1);
  };
  const remove = () => {
    if (!item) return;
    setItems(list => list.filter((_, j) => j !== picked));
    setPicked(null);
  };
  const reset = () => {
    const seed = seedLayout(background, level);
    setItems(seed.items);
    setBowlX(seed.bowlX);
    setPicked(null);
  };
  const save = () => {
    onSave?.({ items: items.map(({ art, x, y, scale, flip }) => ({ art, x: +x.toFixed(3), y: +y.toFixed(3), scale, flip: !!flip })), bowlX: +bowlX.toFixed(3) });
    onClose?.();
  };

  const tool = (icon, label, onPress, disabled) => (
    <TouchableOpacity
      key={label}
      style={[s.tool, disabled && { opacity: 0.35 }]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
    >
      <Ionicons name={icon} size={17} color={c.text1} />
    </TouchableOpacity>
  );

  const shown = DECOR.filter(d => d.group === group);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Decorate</Text>
              <Text style={s.kicker} numberOfLines={1}>{background.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close without saving" hitSlop={8}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>

          {/* The stage. Tapping empty space lets go of the picked item. */}
          <LandscapeBackground background={background} height={STAGE_H} level={level} hideItems style={{ width: '100%' }}>
            <View style={StyleSheet.absoluteFill} onLayout={(e) => setBox(e.nativeEvent.layout)}>
              <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPicked(null)}
                accessibilityRole="button" accessibilityLabel="Let go of the item" />
              {box && items.map((it, i) => (
                <Draggable
                  key={`${it.art}-${i}`}
                  art={it.art} flip={it.flip} x={it.x} y={it.y} scale={it.scale}
                  box={box} ground={ground} picked={picked === i} color={c.gold}
                  label={nameOf(it.art)}
                  onPick={() => setPicked(i)}
                  onMove={(x, y) => update(i, { x, y })}
                />
              ))}
              {box && !!pet && (
                <Draggable
                  art="bowlBlue" x={bowlX} y={(6 - ground) / box.height} scale={BOWL_SCALE}
                  box={box} ground={ground} picked={picked === 'bowl'} color={c.gold} lockY
                  label="Food bowl"
                  onPick={() => setPicked('bowl')}
                  onMove={(x) => setBowlX(x)}
                />
              )}
            </View>
          </LandscapeBackground>

          {/* What's picked, and what you can do to it. */}
          <View style={s.toolRow}>
            <Text style={s.pickedName} numberOfLines={1}>
              {picked === 'bowl' ? 'Food bowl' : item ? nameOf(item.art) : <Text style={s.hint}><Text style={s.bold}>Tap</Text> an item to add it. <Text style={s.bold}>Drag</Text> to move.</Text>}
            </Text>
            {(item || picked === 'bowl') && (
              <View style={s.tools}>
                {tool('arrow-back', 'Move left', () => nudge(-NUDGE, 0))}
                {tool('arrow-forward', 'Move right', () => nudge(NUDGE, 0))}
                {tool('arrow-up', 'Move up', () => nudge(0, NUDGE), picked === 'bowl')}
                {tool('arrow-down', 'Move down', () => nudge(0, -NUDGE), picked === 'bowl')}
                {tool('swap-horizontal', 'Flip', () => item && update(picked, { flip: !item.flip }), !item)}
                {tool('remove', 'Smaller', () => resize(1 / 1.2), !item || item.scale <= SCALE_MIN)}
                {tool('add', 'Bigger', () => resize(1.2), !item || item.scale >= SCALE_MAX)}
                {tool('layers-outline', 'Bring to front', toFront, !item)}
                {tool('trash-outline', 'Remove', remove, !item)}
              </View>
            )}
          </View>
          {note && <Text style={s.note}>{note[0]}<Text style={s.bold}>{note[1]}</Text>{note[2]}</Text>}

          {/* The tray. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.groups} style={{ flexGrow: 0 }}>
            {DECOR_GROUPS.map(g => (
              <TouchableOpacity
                key={g}
                onPress={() => setGroup(g)}
                style={[s.groupChip, group === g && s.groupChipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: group === g }}
              >
                <Text style={[s.groupText, group === g && s.groupTextOn]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={s.grid}>
            {shown.map(d => {
              const a = ART[d.id];
              const open = decorAllowed(d.id, level, background);
              const k = Math.min(TILE / a.w, TILE / a.h, 2.4);
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[s.cell, !open && { opacity: 0.4 }]}
                  onPress={() => add(d)}
                  disabled={!open}
                  accessibilityRole="button"
                  accessibilityLabel={open ? `Add ${d.name}` : d.build ? `${d.name}, earned by mastering a Studio build` : `${d.name}, unlocks at level ${d.level}`}
                  accessibilityState={{ disabled: !open }}
                >
                  <View style={s.thumb}><PixelArt art={a} scale={k} /></View>
                  <Text style={s.cellName} numberOfLines={1}>{open ? d.name : d.build ? 'Studio' : `Lv ${d.level}`}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity onPress={reset} style={s.ghostBtn} accessibilityRole="button" accessibilityLabel="Reset to this scene's own items">
              <Ionicons name="refresh" size={15} color={c.text2} />
              <Text style={s.ghostText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} style={s.saveBtn} accessibilityRole="button">
              <Text style={s.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, paddingHorizontal: sp.lg, paddingTop: sp.md, paddingBottom: 24, width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '94%' },
  grabber:   { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: sp.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.sm },
  title:     { fontSize: t.lg, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1 },
  kicker:    { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', color: c.gold, marginTop: 2 },

  toolRow:   { marginTop: sp.sm, gap: sp.xs },
  pickedName:{ fontSize: t.sm, fontWeight: '800', color: c.text1 },
  hint:      { fontSize: t.xs, fontWeight: '400', color: c.text2 },
  bold:      { fontWeight: '800', color: c.text1 },
  tools:     { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tool:      { width: 34, height: 34, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' },
  note:      { fontSize: t.xs, color: c.text2, marginTop: sp.xs },

  groups:    { gap: sp.xs, paddingVertical: sp.sm },
  groupChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg0 },
  groupChipOn:{ borderColor: c.gold, backgroundColor: c.gold },
  groupText: { fontSize: t.xs, fontWeight: '700', color: c.text2 },
  groupTextOn:{ color: c.onFill },

  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: sp.xs, paddingBottom: sp.sm },
  cell:      { width: 72, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, backgroundColor: c.bg0 },
  thumb:     { width: TILE, height: TILE, alignItems: 'center', justifyContent: 'center' },
  cellName:  { fontSize: 11, color: c.text2, maxWidth: 66 },

  footer:    { flexDirection: 'row', gap: sp.md, marginTop: sp.sm },
  ghostBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: sp.lg, paddingVertical: sp.md, borderRadius: r.md, borderWidth: 1, borderColor: c.border },
  ghostText: { fontSize: t.sm, fontWeight: '700', color: c.text2 },
  saveBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: sp.md, borderRadius: r.md, backgroundColor: c.gold },
  saveText:  { fontSize: t.sm, fontWeight: '800', color: c.onFill },
});
