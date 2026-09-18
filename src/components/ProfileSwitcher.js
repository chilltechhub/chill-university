// src/components/ProfileSwitcher.js
// Header pill + drawer for switching between the Profiles one login holds.
//
// Replaces PerspectiveSwitcher: that switched between four fixed persona
// modes, this switches between profiles the user actually created — "Day
// Job", "Night Job", "Halcyon" — each built from a persona type.
//
// Lives in TopBar so it's reachable everywhere, same reasoning as the FAB and
// command palette. Styling follows the TopBar convention: useTheme() full
// names destructured into the {c, t, s, sh} shorthand makeStyles() expects.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { getPersona } from '../data/personas';
import { FONTS } from '../theme';

export default function ProfileSwitcher() {
  const { colors: c, typography: t, spacing: s, shadows: sh, radius: r } = useTheme();
  const { showEmojis } = useUIPrefs();
  const navigation = useNavigation();
  const {
    visible: profiles, signedOut, active, loading,
    activeDef, isMasterActive, allowedTypes, restrictedReason,
    switchProfile, addProfile, archive, signOut, signIn, hasPin, setPin, clearPin,
  } = useProfiles();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('list');       // 'list' | 'add' | 'pin'
  const [busy, setBusy] = useState(false);
  const [newType, setNewType] = useState(allowedTypes[0]?.key || 'PERSONAL');
  // allowedTypes settles once the profile row (and its birth date) loads,
  // which can be after this mounts — don't leave a type selected that the
  // account can't have, or Create fails with an error instead of just working.
  React.useEffect(() => {
    if (!allowedTypes.some(p => p.key === newType)) setNewType(allowedTypes[0]?.key || 'PERSONAL');
  }, [allowedTypes, newType]);
  const [newName, setNewName] = useState('');
  const [pinFor, setPinFor] = useState(null);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  // Which profiles have a PIN set on THIS device. hasPin is async, so the
  // answer is loaded up front rather than awaited mid-render.
  const [pinnedIds, setPinnedIds] = useState({});

  const refreshPinned = React.useCallback(async () => {
    const entries = await Promise.all(
      profiles.map(async p => [p.id, await hasPin(p.id)])
    );
    setPinnedIds(Object.fromEntries(entries));
  }, [profiles]);

  React.useEffect(() => { if (open) refreshPinned(); }, [open, refreshPinned]);

  const st = makeStyles(c, t, s, sh, r);

  // Nothing to switch to and nothing to add — don't render a dead control.
  // (Guests have no profiles at all; they see the app in its default mode.)
  if (loading || !active) return null;

  const close = () => { setOpen(false); setMode('list'); setNewName(''); setPinValue(''); setPinConfirm(''); setPinFor(null); };

  const pick = async (id) => {
    if (id === active.id) { close(); return; }
    await switchProfile(id);
    close();
  };

  const doAdd = async () => {
    const name = newName.trim();
    if (!name) { Alert.alert('Name it', 'Give this profile a name — "Night Job", "Halcyon", "Home".'); return; }
    setBusy(true);
    try {
      // addProfile activates the new profile itself — see the note there.
      await addProfile({ type: newType, name });
      close();
    } catch (e) {
      Alert.alert('Could not add profile', e?.message || 'Try again.');
    } finally { setBusy(false); }
  };

  const doSignOut = async (p) => {
    try { await signOut(p.id); }
    catch (e) { Alert.alert('Cannot sign out', e?.message || 'Try again.'); }
  };

  const startSignIn = async (p) => {
    if (await hasPin(p.id)) { setPinFor(p); setPinValue(''); setMode('pin'); return; }
    await signIn(p.id);
  };

  const submitPin = async () => {
    setBusy(true);
    try {
      const okPin = await signIn(pinFor.id, pinValue);
      if (!okPin) { Alert.alert('Wrong PIN', 'That PIN did not match.'); return; }
      setMode('list'); setPinFor(null); setPinValue('');
    } finally { setBusy(false); }
  };

  const startSetPin = (p) => {
    setPinFor(p); setPinValue(''); setPinConfirm(''); setMode('setpin');
  };

  const submitSetPin = async () => {
    if (!/^\d{4,8}$/.test(pinValue)) {
      Alert.alert('PIN too short', 'Use 4 to 8 digits.');
      return;
    }
    if (pinValue !== pinConfirm) {
      Alert.alert('PINs do not match', 'Enter the same PIN twice.');
      return;
    }
    setBusy(true);
    try {
      await setPin(pinFor.id, pinValue);
      await refreshPinned();
      setMode('list'); setPinFor(null); setPinValue(''); setPinConfirm('');
    } catch (e) {
      Alert.alert('Could not set PIN', e?.message || 'Try again.');
    } finally { setBusy(false); }
  };

  const removeLock = (p) => {
    Alert.alert(
      `Remove the lock on "${p.name}"?`,
      'It will sign back in on this device without a PIN.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove lock', style: 'destructive', onPress: async () => {
          await clearPin(p.id);
          await refreshPinned();
        } },
      ],
    );
  };

  const confirmArchive = (p) => {
    Alert.alert(
      `Remove "${p.name}"?`,
      'It comes off your profile list. Anything saved to its Vault is kept, not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try { await archive(p.id); }
            catch (e) { Alert.alert('Could not remove', e?.message || 'Try again.'); }
          },
        },
      ],
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[st.pill, { borderColor: activeDef.color }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`Current profile: ${active.name}. Tap to switch.`}
      >
        {showEmojis && <Text style={st.pillEmoji}>{active.emoji || activeDef.emoji}</Text>}
        <Text style={[st.pillText, { color: activeDef.color }]} numberOfLines={1}>{active.name}</Text>
        <Ionicons name="chevron-down" size={11} color={activeDef.color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={st.backdrop} onPress={close}>
          <Pressable style={st.sheet} onPress={() => {}}>
            <View style={st.sheetHandle} />

            {/* ── List ─────────────────────────────────────────────────── */}
            {mode === 'list' && (
              <>
                <Text style={st.sheetTitle}>Your profiles</Text>
                <Text style={st.sheetSub}>
                  Your level, points and streak are shared across all of them — each profile keeps its own
                  targets, classes and Vault.
                </Text>

                <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                  {profiles.map(p => {
                    const def = getPersona(p.type);
                    const isActive = p.id === active.id;
                    return (
                      <View
                        key={p.id}
                        style={[st.row, {
                          borderColor: isActive ? def.color : c.border,
                          backgroundColor: isActive ? def.color + '18' : c.bg0,
                        }]}
                      >
                        <TouchableOpacity style={st.rowMain} onPress={() => pick(p.id)} activeOpacity={0.8}>
                          <View style={[st.rowCheck, {
                            borderColor: isActive ? def.color : c.text4,
                            backgroundColor: isActive ? def.color : 'transparent',
                          }]}>
                            {isActive && <Ionicons name="checkmark" size={12} color="#fff" />}
                          </View>
                          {showEmojis && <Text style={st.rowEmoji}>{p.emoji || def.emoji}</Text>}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Text style={[st.rowLabel, { color: isActive ? def.color : c.text1 }]} numberOfLines={1}>
                                {p.name}
                              </Text>
                              {p.is_master && (
                                <View style={[st.masterTag, { borderColor: def.color }]}>
                                  <Text style={[st.masterTagText, { color: def.color }]}>MASTER</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[st.rowQuest, { color: def.color }]}>{def.short} · {def.questLine}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Sign out is per-device: hides it here, keeps it on
                            the account. The master can also remove a profile
                            outright, which is a different thing entirely. */}
                        <View style={st.rowActions}>
                          {/* Lock: sets the PIN this profile will ask for
                              when signing back in on this device. */}
                          <TouchableOpacity
                            onPress={() => (pinnedIds[p.id] ? removeLock(p) : startSetPin(p))}
                            hitSlop={8}
                            style={st.iconBtn}
                            accessibilityLabel={pinnedIds[p.id] ? `Remove lock on ${p.name}` : `Set a PIN on ${p.name}`}
                          >
                            <Ionicons
                              name={pinnedIds[p.id] ? 'lock-closed' : 'lock-open-outline'}
                              size={15}
                              color={pinnedIds[p.id] ? def.color : c.text4}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => doSignOut(p)} hitSlop={8} style={st.iconBtn}
                            accessibilityLabel={`Sign out of ${p.name} on this device`}>
                            <Ionicons name="log-out-outline" size={16} color={c.text4} />
                          </TouchableOpacity>
                          {isMasterActive && !p.is_master && (
                            <TouchableOpacity onPress={() => confirmArchive(p)} hitSlop={8} style={st.iconBtn}>
                              <Ionicons name="trash-outline" size={15} color={c.text4} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {/* Signed out on this device */}
                  {signedOut.length > 0 && (
                    <>
                      <Text style={st.groupLabel}>Signed out on this device</Text>
                      {signedOut.map(p => {
                        const def = getPersona(p.type);
                        return (
                          <View key={p.id} style={[st.row, { borderColor: c.border, backgroundColor: c.bg2, opacity: 0.85 }]}>
                            <View style={st.rowMain}>
                              <Ionicons name="lock-closed-outline" size={15} color={c.text4} />
                              <View style={{ flex: 1 }}>
                                <Text style={[st.rowLabel, { color: c.text3 }]} numberOfLines={1}>{p.name}</Text>
                                <Text style={st.rowBlurb}>{def.short}</Text>
                              </View>
                            </View>
                            <TouchableOpacity onPress={() => startSignIn(p)} style={[st.smallBtn, { borderColor: def.color }]}>
                              <Text style={[st.smallBtnText, { color: def.color }]}>Sign in</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </>
                  )}
                </ScrollView>

                <TouchableOpacity
                  style={[st.addBtn, { borderColor: c.teal }]}
                  onPress={() => { setNewType(allowedTypes[0]?.key || 'PERSONAL'); setMode('add'); }}
                >
                  <Ionicons name="add" size={16} color={c.teal} />
                  <Text style={[st.addBtnText, { color: c.teal }]}>Add a profile</Text>
                </TouchableOpacity>

                {/* The master's cross-profile overview — what "the first one
                    controls all" actually gets you. */}
                {isMasterActive && profiles.length > 1 && (
                  <TouchableOpacity
                    style={st.rollupBtn}
                    onPress={() => { close(); navigation.navigate('AllProfiles'); }}
                  >
                    <Ionicons name="grid-outline" size={15} color={c.text2} />
                    <Text style={st.rollupText}>All profiles overview</Text>
                    <Ionicons name="chevron-forward" size={14} color={c.text4} />
                  </TouchableOpacity>
                )}

                {restrictedReason === 'guest' && (
                  <Text style={st.gateNote}>
                    Business and Entrepreneur profiles cover adult financial topics. Sign in and confirm your
                    date of birth to add one.
                  </Text>
                )}
                {restrictedReason === 'minor' && (
                  <Text style={st.gateNote}>
                    Business and Entrepreneur profiles cover adult financial topics and are available on an
                    adult account.
                  </Text>
                )}
                {restrictedReason === 'kid' && (
                  <Text style={st.gateNote}>
                    Student is the profile type built for your age. More types open up as you get older.
                  </Text>
                )}
                {restrictedReason === 'unknown' && (
                  <Text style={st.gateNote}>
                    Business and Entrepreneur profiles cover adult financial topics, so they need a confirmed
                    date of birth on the account.
                  </Text>
                )}

                {/* Say plainly what the lock is and isn't. It keeps a
                    profile off the screen when you hand someone your phone;
                    it is not account security, because anyone who can sign
                    into the account itself can lift it. */}
                <Text style={st.gateNote}>
                  Sign out hides a profile on this device only — nothing is deleted, and it stays on your
                  account. A PIN is asked for when signing it back in here. It's a privacy screen, not
                  account security: signing into your account can always restore it.
                </Text>

                <TouchableOpacity style={st.closeBtn} onPress={close}>
                  <Text style={st.closeText}>Close</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── Set a PIN ────────────────────────────────────────────── */}
            {mode === 'setpin' && pinFor && (
              <>
                <Text style={st.sheetTitle}>Lock "{pinFor.name}"</Text>
                <Text style={st.sheetSub}>
                  Choose 4-8 digits. This profile will ask for it when signing back in on this device.
                </Text>
                <Text style={st.fieldLabel}>PIN</Text>
                <TextInput
                  style={[st.input, { textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                  value={pinValue}
                  onChangeText={v => setPinValue(v.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••" placeholderTextColor={c.text4}
                  keyboardType="number-pad" secureTextEntry autoFocus
                />
                <Text style={st.fieldLabel}>Confirm</Text>
                <TextInput
                  style={[st.input, { textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                  value={pinConfirm}
                  onChangeText={v => setPinConfirm(v.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••" placeholderTextColor={c.text4}
                  keyboardType="number-pad" secureTextEntry
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[st.closeBtn, { flex: 1, marginTop: 0 }]} onPress={() => setMode('list')}>
                    <Text style={st.closeText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.primaryBtn, { flex: 1, backgroundColor: getPersona(pinFor.type).color }]}
                    onPress={submitSetPin} disabled={busy}
                  >
                    {busy ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={st.primaryBtnText}>Set PIN</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── Add ──────────────────────────────────────────────────── */}
            {mode === 'add' && (
              <>
                <Text style={st.sheetTitle}>Add a profile</Text>
                <Text style={st.sheetSub}>
                  A second job, another startup, a separate personal space — each one keeps its own targets and Vault.
                </Text>

                <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                  {allowedTypes.map(p => {
                    const sel = newType === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        onPress={() => setNewType(p.key)}
                        activeOpacity={0.8}
                        style={[st.row, {
                          borderColor: sel ? p.color : c.border,
                          backgroundColor: sel ? p.color + '18' : c.bg0,
                        }]}
                      >
                        <View style={st.rowMain}>
                          <View style={[st.rowCheck, {
                            borderColor: sel ? p.color : c.text4,
                            backgroundColor: sel ? p.color : 'transparent',
                          }]}>
                            {sel && <Ionicons name="checkmark" size={12} color="#fff" />}
                          </View>
                          {showEmojis && <Text style={st.rowEmoji}>{p.emoji}</Text>}
                          <View style={{ flex: 1 }}>
                            <Text style={[st.rowLabel, { color: sel ? p.color : c.text1 }]}>{p.label}</Text>
                            <Text style={st.rowBlurb} numberOfLines={2}>{p.blurb}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={st.fieldLabel}>Name it</Text>
                <TextInput
                  style={st.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={newType === 'BUSINESS' ? 'e.g. Night Job' : newType === 'ENTREPRENEUR' ? 'e.g. Halcyon' : 'e.g. Home'}
                  placeholderTextColor={c.text4}
                  maxLength={40}
                  autoFocus
                />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[st.closeBtn, { flex: 1, marginTop: 0 }]} onPress={() => setMode('list')}>
                    <Text style={st.closeText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[st.primaryBtn, { flex: 1, backgroundColor: getPersona(newType).color }]}
                    onPress={doAdd}
                    disabled={busy}
                  >
                    {busy ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={st.primaryBtnText}>Create</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ── PIN ──────────────────────────────────────────────────── */}
            {mode === 'pin' && pinFor && (
              <>
                <Text style={st.sheetTitle}>Sign in to "{pinFor.name}"</Text>
                <Text style={st.sheetSub}>Enter this profile's PIN to bring it back on this device.</Text>
                <TextInput
                  style={[st.input, { textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                  value={pinValue}
                  onChangeText={v => setPinValue(v.replace(/\D/g, '').slice(0, 8))}
                  placeholder="••••"
                  placeholderTextColor={c.text4}
                  keyboardType="number-pad"
                  secureTextEntry
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity style={[st.closeBtn, { flex: 1, marginTop: 0 }]} onPress={() => setMode('list')}>
                    <Text style={st.closeText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[st.primaryBtn, { flex: 1, backgroundColor: c.teal }]} onPress={submitPin} disabled={busy}>
                    {busy ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={st.primaryBtnText}>Unlock</Text>}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c, t, s, sh, r) => StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: s.sm, paddingVertical: 3,
    marginRight: s.sm, maxWidth: 112, backgroundColor: c.bg0,
  },
  pillEmoji: { fontSize: 11 },
  pillText: {
    fontSize: t.xs, fontWeight: t.bold,
    fontFamily: FONTS.display, letterSpacing: 0.2, flexShrink: 1,
  },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: c.bg1,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: s.lg, paddingTop: s.sm, paddingBottom: s.xl + 8,
    borderTopWidth: 0.5, borderTopColor: c.border,
    ...sh.lg,
  },
  sheetHandle: {
    alignSelf: 'center', width: 38, height: 4, borderRadius: 2,
    backgroundColor: c.border, marginBottom: s.md,
  },
  sheetTitle: { fontSize: 17, fontFamily: FONTS.display, fontWeight: '800', color: c.text1, marginBottom: 4 },
  sheetSub: { fontSize: 12, color: c.text3, lineHeight: 17, marginBottom: s.md },

  groupLabel: {
    fontSize: 10, color: c.text4, fontFamily: FONTS.mono,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: 10, marginBottom: 6,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  rowEmoji: { fontSize: 20 },
  rowLabel: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  rowBlurb: { fontSize: 11, color: c.text3, lineHeight: 15 },
  rowQuest: {
    fontSize: 10, fontFamily: FONTS.mono,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
  },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 6 },

  masterTag: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  masterTagText: { fontSize: 8, fontFamily: FONTS.mono, fontWeight: '800', letterSpacing: 0.5 },

  smallBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  smallBtnText: { fontSize: 11, fontWeight: '700' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 11, marginTop: 4,
  },
  addBtnText: { fontSize: 13, fontWeight: '700' },

  rollupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 11, paddingHorizontal: 12, marginTop: 8,
    borderRadius: 12, backgroundColor: c.bg0,
  },
  rollupText: { flex: 1, fontSize: 13, fontWeight: '600', color: c.text2 },

  fieldLabel: {
    fontSize: 11, color: c.text4, fontFamily: FONTS.mono,
    textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 12, marginBottom: 6,
  },
  input: {
    backgroundColor: c.bg0, borderRadius: 12, padding: 13, fontSize: 15,
    color: c.text1, borderWidth: 1, borderColor: c.border,
  },

  gateNote: { fontSize: 11, color: c.text4, lineHeight: 15, marginTop: 8 },

  primaryBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  primaryBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  closeBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: c.bg2, marginTop: 8 },
  closeText: { fontSize: 13, fontWeight: '700', color: c.text2 },
});
