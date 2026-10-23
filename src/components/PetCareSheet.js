// src/components/PetCareSheet.js
// Tap the pet (or its food bubble, or the hearts on its stage) and this opens:
// how hungry it is, food to buy with points, and how close it is to its next
// level.
//
// The rules are in src/logic/petHunger.js (four hearts, one empties every 6
// hours, a hungry pet finds no coins) and src/logic/petBond.js (feeding grows
// bond, double when fed before it's empty; each level is an upgrade). Nothing
// bad ever happens to the pet and bond never drops, so this sheet never
// guilt-trips: it says how full the pet is, what food does, and what's next.
//
// Feeding plays a short scene on the big pet here: the food drops in, the pet
// chomps twice, a heart floats up and the new hearts pop in. A new level gets
// its own banner with what it unlocked. With Reduce Motion on it skips the
// movement.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Easing, AccessibilityInfo,
  ScrollView, TextInput, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import PetCompanion from './PetCompanion';
import PixelArt from './PixelArt';
import usePetCare, { useSpendablePoints } from '../logic/usePetCare';
import { FOODS, MAX_HEARTS, cantFeed } from '../logic/petHunger';
import {
  bondProgress, petScale, NAME_LEVEL, NAME_MAX, GIFT_POINTS, giftReadyAt, MAX_BOND_LEVEL,
} from '../logic/petBond';
import { syncPetReminder, cancelPetReminder } from '../logic/notificationScheduler';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { useReducedMotion } from '../logic/a11yPrefs';
import { FONTS } from '../theme';

const PET_SIZE = 84;

const MOOD = {
  full:    { label: 'Full',    line: ['Happy and ', 'finding coins', '.'] },
  peckish: { label: 'Peckish', line: ['Getting hungry. ', 'Feed', ' it soon.'] },
  hungry:  { label: 'Hungry',  line: ['', 'No coins', ' until it eats.'] },
};

// Whole hours left, rounded up, less a minute: a phone clock a few seconds
// behind the server's showed a gift just opened as "Next gift in 21h".
const hoursUntil = (t) => Math.max(0, Math.ceil((t - Date.now() - 60 * 1000) / (60 * 60 * 1000)));

export default function PetCareSheet({ visible, onClose, pet }) {
  const { colors: c, typography: t, spacing: sp, radius: r } = useTheme();
  const { user, points } = useUserProgress();
  const care = usePetCare(user?.id, !!pet);
  const { hearts, mood, fullUntil, feed, bond, nickname } = care;
  const wallet = useSpendablePoints(user?.id, points);
  const reduceMotion = useReducedMotion();
  const [remindOn, setRemindOn] = useSetting(SETTING_KEYS.PET_REMINDERS, true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);       // [before, bold, after]
  const [levelUp, setLevelUp] = useState(null); // the level just reached
  const [naming, setNaming] = useState(false);
  const [draft, setDraft] = useState('');
  const [eating, setEating] = useState(null);   // the food mid-scene
  const [popFrom, setPopFrom] = useState(MAX_HEARTS); // hearts at or past this index pop in

  const drop = useRef(new Animated.Value(0)).current;    // 0 above, 1 at the pet's mouth
  const foodScale = useRef(new Animated.Value(1)).current;
  const chomp = useRef(new Animated.Value(1)).current;
  const floatUp = useRef(new Animated.Value(0)).current; // the "+♥"
  const heartPop = useRef(new Animated.Value(1)).current;
  const bannerPop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) { setNote(null); setEating(null); setLevelUp(null); setNaming(false); }
  }, [visible]);

  if (!pet) return null;
  const s = makeStyles(c, t, sp, r);
  const name = nickname || pet.name;
  const moodColor = mood === 'hungry' ? c.error : mood === 'peckish' ? c.gold : c.teal;
  const m = MOOD[mood];
  const prog = bondProgress(bond);
  const level = prog.level.level;
  const petSize = Math.round(PET_SIZE * petScale(level));

  const play = (food, before) => {
    setPopFrom(before);
    if (reduceMotion) { heartPop.setValue(1); return; }
    setEating(food);
    drop.setValue(0); foodScale.setValue(1); chomp.setValue(1); floatUp.setValue(0); heartPop.setValue(0);
    Animated.sequence([
      Animated.timing(drop, { toValue: 1, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(chomp, { toValue: 1.14, duration: 110, useNativeDriver: true }),
          Animated.timing(chomp, { toValue: 0.94, duration: 110, useNativeDriver: true }),
          Animated.timing(chomp, { toValue: 1.12, duration: 110, useNativeDriver: true }),
          Animated.timing(chomp, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]),
        Animated.timing(foodScale, { toValue: 0, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(floatUp, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(heartPop, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]),
    ]).start(() => setEating(null));
  };

  const celebrate = (lvl) => {
    setLevelUp(lvl);
    if (lvl >= NAME_LEVEL && !nickname) { setNaming(true); setDraft(''); }
    if (reduceMotion) return;
    bannerPop.setValue(0.6);
    Animated.spring(bannerPop, { toValue: 1, friction: 4, tension: 110, useNativeDriver: true }).start();
  };

  const onFeed = async (food) => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    const before = hearts;
    const res = await feed(food.id, wallet);
    setBusy(false);
    if (res.ok) {
      play(food, before);
      if (res.gained) setNote(['', `+${res.gained} bond`, before > 0 ? '  ·  ×2, fed before it got hungry' : '']);
      if (res.levelUp) celebrate(res.levelUp);
      AccessibilityInfo.announceForAccessibility?.(`${name} ate the ${food.label.toLowerCase()}.${res.gained ? ` Plus ${res.gained} bond.` : ''}`);
      // Right after feeding is the moment to ask about notifications, if the
      // reminder is on and the phone hasn't been asked yet. The bowl changed,
      // so this also moves the reminder back.
      if (remindOn !== false) syncPetReminder({ fullUntil: res.fullUntil, name, enabled: true, ask: true });
    } else if (res.reason === 'points') {
      setNote(['Not enough points yet. Practice in ', 'Learn', ' earns more.']);
    } else if (res.reason === 'full') {
      setNote([`${name} is `, 'full', '.']);
    } else {
      setNote(['Couldn\'t feed it just now. ', 'Try again', '.']);
    }
  };

  const saveName = async () => {
    const res = await care.setName(draft);
    if (res.ok) { setNaming(false); setNote(null); }
    else setNote(['Couldn\'t save the name. ', 'Try again', '.']);
  };

  const onGift = async () => {
    if (busy) return;
    setBusy(true);
    const pts = await care.openGift();
    setBusy(false);
    setNote(pts ? [`${name} brought you `, `+${pts} pts`, '!'] : ['No gift yet. ', 'Check back later', '.']);
  };

  const onRemind = async (on) => {
    setRemindOn(on);
    if (!on) { cancelPetReminder(); return; }
    const ok = await syncPetReminder({ fullUntil: care.fullUntil, name, enabled: true, ask: true });
    if (ok === false) {
      setRemindOn(false);
      setNote(['Notifications are off for this app. Turn them on in your ', 'phone settings', '.']);
    }
  };

  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] });
  const floatY = floatUp.interpolate({ inputRange: [0, 1], outputRange: [0, -46] });
  const floatOpacity = floatUp.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] });
  const giftWaitH = care.canGift && !care.giftReady ? hoursUntil(giftReadyAt(care.giftAt)) : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" activeOpacity={1} />
        <View style={s.sheet}>
          <View style={s.grabber} />
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={s.titleRow}>
                <Text style={s.title} numberOfLines={1}>{name}</Text>
                <View style={s.levelChip}>
                  {level >= MAX_BOND_LEVEL && <Ionicons name="ribbon" size={11} color={c.onFill} />}
                  <Text style={s.levelChipText}>{prog.level.name}</Text>
                </View>
              </View>
              <Text style={[s.kicker, { color: moodColor }]}>{m.label}</Text>
            </View>
            <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={c.text3} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {levelUp && (
              <Animated.View style={[s.banner, { transform: [{ scale: bannerPop }] }]} accessibilityLiveRegion="polite">
                <Ionicons name="sparkles" size={18} color={c.gold} />
                <Text style={s.bannerText}>
                  <Text style={s.bold}>Closer now.</Text> {name} is now your <Text style={s.bold}>{prog.level.name}</Text>.
                  {prog.level.perk ? <Text>{'\n'}Unlocked: <Text style={s.bold}>{prog.level.perk}</Text></Text> : null}
                </Text>
              </Animated.View>
            )}

            {/* The pet, big, with room above it for the food to fall in. It
                grows a little with every level. */}
            <View style={[s.stage, { height: petSize + 40 }]}>
              <Animated.View style={{ transform: [{ scale: chomp }] }}>
                <PetCompanion pet={pet} size={petSize} lying={mood === 'hungry'} />
                {level >= MAX_BOND_LEVEL && (
                  <View style={s.ribbon} pointerEvents="none">
                    <Ionicons name="ribbon" size={20} color={c.gold} />
                  </View>
                )}
              </Animated.View>
              {eating && (
                <Animated.View pointerEvents="none" style={[s.food, { bottom: petSize * 0.45, transform: [{ translateY: dropY }, { scale: foodScale }] }]}>
                  <PixelArt art={eating.art} height={28} />
                </Animated.View>
              )}
              {eating && (
                <Animated.View pointerEvents="none" style={[s.food, { bottom: petSize, opacity: floatOpacity, transform: [{ translateY: floatY }] }]}>
                  <Ionicons name="heart" size={22} color={c.error} />
                </Animated.View>
              )}
            </View>

            <View style={s.heartsRow} accessible accessibilityLabel={`${hearts} of ${MAX_HEARTS} hearts`}>
              {Array.from({ length: MAX_HEARTS }, (_, i) => {
                const filled = i < hearts;
                const popping = filled && i >= popFrom;
                return (
                  <Animated.View key={i} style={popping ? { transform: [{ scale: heartPop }] } : null}>
                    <Ionicons name={filled ? 'heart' : 'heart-outline'} size={24} color={filled ? c.error : c.text4} />
                  </Animated.View>
                );
              })}
            </View>
            <Text style={s.moodLine}>
              {m.line[0]}<Text style={s.bold}>{m.line[1]}</Text>{m.line[2]}
              {hearts > 0 && fullUntil != null ? <Text style={s.dim}>{'  ·  '}<Text style={s.bold}>{hoursUntil(fullUntil)}h</Text> left</Text> : null}
            </Text>

            <View style={s.foodRow}>
              {FOODS.map(food => {
                const why = cantFeed(food, { hearts, wallet });
                const off = !!why || busy;
                return (
                  <TouchableOpacity
                    key={food.id}
                    style={[s.foodBtn, off && s.foodBtnOff]}
                    onPress={() => onFeed(food)}
                    disabled={off}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: off }}
                    accessibilityLabel={`${food.label}, ${food.cost} points, ${food.hearts >= MAX_HEARTS ? 'fills every heart' : `adds ${food.hearts} heart`}`}
                  >
                    <PixelArt art={food.art} height={22} style={off && { opacity: 0.45 }} />
                    <Text style={[s.foodName, off && { color: c.text3 }]}>{food.label}</Text>
                    <Text style={s.foodWhat}>{food.hearts >= MAX_HEARTS ? 'Fills up' : `+${food.hearts} heart`}</Text>
                    <View style={[s.costPill, off && { backgroundColor: c.bg3 }]}>
                      <Text style={[s.costText, off && { color: c.text3 }]}>
                        {why === 'full' ? 'Full' : why === 'points' ? `Need ${food.cost}` : `${food.cost} pts`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {note && (
              <Text style={s.note}>{note[0]}<Text style={s.bold}>{note[1]}</Text>{note[2]}</Text>
            )}

            {/* ── Bond: the level, how far to the next, and what it unlocks ── */}
            <View style={s.panel}>
              <View style={s.panelTop}>
                <Text style={s.panelHead}>Bond</Text>
                <Text style={s.panelCount}>
                  {prog.next ? <><Text style={s.bold}>{prog.into}</Text>/{prog.need} to {prog.next.name}</> : <Text style={s.bold}>Max level</Text>}
                </Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${Math.round(prog.pct * 100)}%` }]} />
              </View>
              {prog.next ? (
                <Text style={s.panelLine}>Next: <Text style={s.bold}>{prog.next.perk}</Text></Text>
              ) : (
                <Text style={s.panelLine}><Text style={s.bold}>Best buddies.</Text> Coins pay 3 pts.</Text>
              )}
              <Text style={s.panelHint}>Feed before it's hungry for <Text style={s.bold}>2× bond</Text>.</Text>
            </View>

            {/* ── Name it (Pal and up) ── */}
            {level >= NAME_LEVEL && (naming ? (
              <View style={s.nameRow}>
                <TextInput
                  style={s.nameInput}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={`Name your ${pet.name.toLowerCase()}`}
                  placeholderTextColor={c.text3}
                  maxLength={NAME_MAX}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  accessibilityLabel="Pet name"
                />
                <TouchableOpacity style={s.smallBtn} onPress={saveName} accessibilityRole="button" accessibilityLabel="Save name">
                  <Text style={s.smallBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.linkRow} onPress={() => { setDraft(nickname || ''); setNaming(true); }} accessibilityRole="button" accessibilityLabel={nickname ? 'Rename your pet' : 'Name your pet'}>
                <Ionicons name="pencil" size={14} color={c.gold} />
                <Text style={s.linkText}>{nickname ? 'Rename' : `Name your ${pet.name.toLowerCase()}`}</Text>
              </TouchableOpacity>
            ))}

            {/* ── The daily gift (Great buddy and up) ── */}
            {care.canGift && (care.giftReady ? (
              <TouchableOpacity style={s.giftBtn} onPress={onGift} disabled={busy} accessibilityRole="button" accessibilityLabel={`Open ${name}'s gift, ${GIFT_POINTS} points`}>
                <Ionicons name="gift" size={18} color={c.onFill} />
                <Text style={s.giftBtnText}>{name} brought you a gift · +{GIFT_POINTS} pts</Text>
              </TouchableOpacity>
            ) : (
              <Text style={s.giftWait}>Next gift in <Text style={s.bold}>{giftWaitH}h</Text></Text>
            ))}

            {/* ── The reminder ── */}
            <View style={s.remindRow}>
              <Ionicons name="notifications-outline" size={16} color={c.text2} />
              <Text style={s.remindText}>Remind me <Text style={s.bold}>before it's hungry</Text></Text>
              <Switch
                value={remindOn !== false}
                onValueChange={onRemind}
                trackColor={{ false: c.borderStrong, true: c.teal }}
                thumbColor="#fff"
                accessibilityLabel="Remind me before my pet is hungry"
              />
            </View>

            <Text style={s.wallet}>
              <Text style={s.bold}>{wallet.toLocaleString()}</Text> points for pet food
              <Text style={s.dim}>{'  ·  '}spending never lowers your <Text style={s.bold}>rank</Text></Text>
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (c, t, sp, r) => StyleSheet.create({
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, paddingHorizontal: sp.xl, paddingTop: sp.md, paddingBottom: 28, width: '100%', maxWidth: 560, alignSelf: 'center', maxHeight: '90%' },
  grabber:   { width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: sp.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: sp.md, marginBottom: sp.xs },
  titleRow:  { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  title:     { fontSize: t.lg, fontFamily: FONTS.displaySemibold, fontWeight: '800', color: c.text1, flexShrink: 1 },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: c.gold },
  levelChipText: { fontSize: 11, fontWeight: '800', color: c.onFill },
  kicker:    { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800', marginTop: 2 },

  banner:    { flexDirection: 'row', alignItems: 'center', gap: sp.sm, padding: sp.md, borderRadius: r.lg, borderWidth: 1, borderColor: c.gold, backgroundColor: c.bg0, marginTop: sp.sm },
  bannerText:{ flex: 1, fontSize: t.sm, color: c.text1, lineHeight: 20 },

  stage:     { alignItems: 'center', justifyContent: 'flex-end', marginTop: sp.xs },
  ribbon:    { position: 'absolute', bottom: 0, right: -8 },
  food:      { position: 'absolute' },

  heartsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: sp.sm },
  moodLine:  { fontSize: t.sm, color: c.text2, textAlign: 'center', marginTop: sp.xs },
  bold:      { fontWeight: '800', color: c.text1 },
  dim:       { color: c.text3 },

  foodRow:   { flexDirection: 'row', gap: sp.md, marginTop: sp.md },
  foodBtn:   { flex: 1, alignItems: 'center', gap: 1, paddingVertical: sp.sm, borderRadius: r.lg, borderWidth: 1, borderColor: c.gold, backgroundColor: c.bg0 },
  foodBtnOff:{ borderColor: c.border, opacity: 0.75 },
  foodName:  { fontSize: t.sm, fontWeight: '800', color: c.text1, marginTop: 2 },
  foodWhat:  { fontSize: t.xs, color: c.text3 },
  costPill:  { marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: c.gold },
  costText:  { fontSize: t.xs, fontWeight: '800', color: c.onFill },

  note:      { fontSize: t.xs, color: c.text2, textAlign: 'center', marginTop: sp.sm },

  panel:     { marginTop: sp.md, padding: sp.md, borderRadius: r.lg, borderWidth: 0.5, borderColor: c.border, backgroundColor: c.bg0 },
  panelTop:  { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  panelHead: { fontSize: 11, color: c.gold, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '800' },
  panelCount:{ fontSize: t.xs, color: c.text2 },
  track:     { height: 6, borderRadius: 3, backgroundColor: c.bg3, overflow: 'hidden', marginTop: sp.sm },
  fill:      { height: 6, borderRadius: 3, backgroundColor: c.gold },
  panelLine: { fontSize: t.xs, color: c.text2, marginTop: sp.sm },
  panelHint: { fontSize: t.xs, color: c.text3, marginTop: 2 },

  nameRow:   { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginTop: sp.md },
  nameInput: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: sp.md, paddingVertical: sp.sm, fontSize: t.sm, color: c.text1, backgroundColor: c.bg0 },
  smallBtn:  { backgroundColor: c.teal, borderRadius: r.md, paddingHorizontal: sp.md, paddingVertical: sp.sm },
  smallBtnText: { color: c.onFill, fontSize: t.xs, fontWeight: '800' },
  linkRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: sp.sm, marginTop: sp.xs },
  linkText:  { color: c.gold, fontSize: t.xs, fontWeight: '800' },

  giftBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.sm, backgroundColor: c.gold, borderRadius: r.md, paddingVertical: sp.md, marginTop: sp.md },
  giftBtnText:{ color: c.onFill, fontSize: t.sm, fontWeight: '800' },
  giftWait:  { fontSize: t.xs, color: c.text3, textAlign: 'center', marginTop: sp.md },

  remindRow: { flexDirection: 'row', alignItems: 'center', gap: sp.sm, marginTop: sp.md, paddingTop: sp.md, borderTopWidth: 0.5, borderTopColor: c.border },
  remindText:{ flex: 1, fontSize: t.sm, color: c.text2 },

  wallet:    { fontSize: t.xs, color: c.text2, textAlign: 'center', marginTop: sp.md },
});
