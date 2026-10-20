// src/screens/SettingsScreen.js
// App settings — theme toggle controls app-wide dark/light mode

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, TextInput, Linking, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { supabase } from '../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../api/offlineCache';
import { RANK_LABELS } from '../theme';
import { SectionLabel, Eyebrow, Button, ListRow, Readout } from '../components/ui';
import LevelRing from '../components/LevelRing';
import { getRank, getTierProgress } from '../logic/rankUtils';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { resetSeenScreens } from '../logic/useFirstVisitTutorial';
import { syncReminders, cancelAllReminders, computeReminderState, syncPetReminder, cancelPetReminder } from '../logic/notificationScheduler';
import usePetCare from '../logic/usePetCare';
import { readEquippedPet } from '../logic/useCharacterLoadout';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTour } from '../../context/TourContext';
import TourSpot from '../components/TourSpot';
import { CREST_COLORS, ROLE_BADGES } from '../data/crestOptions';
import { useAccess } from '../../context/AccessContext';
import { usePlus } from '../../context/PlusContext';
import { PRIVACY_POLICY_URL, TERMS_URL, SUPPORT_EMAIL } from '../config/legal';
import { shareMyDataExport } from '../api/dataExport';
import { isMinorRequiringConsent } from '../logic/ageOfConsent';
import { dobFromParts, dobProblem } from '../logic/dateUtils';
import { confirmAsync } from '../logic/confirm';
import { signOutAndClear, clearLocalUserData } from '../logic/localUserData';
import TwoFactorSheet from '../components/TwoFactorSheet';

// Thin adapter: the existing call sites pass `label`, and c/t/s/r (ignored).
function SettingRow({ label, ...rest }) {
  return <ListRow title={label} {...rest} />;
}

// Replaces the old "relaunch the whole 7-step onboarding just to change a
// color" flow — crest color + role badge are the only two fields that
// picker ever actually needed to touch (see MultiStepOnboarding.js's
// Character step for why: everything else there is either the real
// wardrobe, already editable from Profile, or a one-time setup answer).
function CrestModal({ visible, crestColor, roleBadge, onClose, onSave, c, t, s, r }) {
  const [color, setColor] = useState(crestColor);
  const [badge, setBadge] = useState(roleBadge);

  useEffect(() => { if (visible) { setColor(crestColor); setBadge(roleBadge); } }, [visible, crestColor, roleBadge]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.lg }}>
            <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>Crest</Text>
            <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>

          <Eyebrow style={{ marginBottom: s.sm }}>Crest color</Eyebrow>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.lg }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {CREST_COLORS.map(cc => (
                <TouchableOpacity key={cc.key} onPress={() => setColor(cc.key)} style={{ alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: cc.color, borderWidth: 3, borderColor: color === cc.key ? c.text1 : 'transparent' }} />
                  <Text style={{ fontSize: 11, color: color === cc.key ? c.text1 : c.text3 }}>{cc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Eyebrow style={{ marginBottom: s.sm }}>Role badge</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: s.xl }}>
            {ROLE_BADGES.map(b => (
              <TouchableOpacity key={b.key} onPress={() => setBadge(b.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: badge === b.key ? c.teal : c.border, backgroundColor: badge === b.key ? c.teal + '22' : c.bg0 }}>
                <Text style={{ fontSize: 16 }}>{b.emoji}</Text>
                <Text style={{ fontSize: 12, color: badge === b.key ? c.teal : c.text3, fontWeight: badge === b.key ? '700' : '400' }}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button label="Save" onPress={() => onSave(color, badge)} />
        </View>
      </View>
    </Modal>
  );
}

// Shown once, on the way out — collected via supabase/migrations/
// 20260906160000_account_deletion_feedback.sql's submit_deletion_feedback(),
// a table deliberately NOT linked to the user (see that file), since it has
// to survive the very cascade delete_my_account() is about to trigger.
const DELETION_REASONS = [
  { key: 'not_using',   label: 'Not using it enough' },
  { key: 'missing',     label: 'Missing a feature I need' },
  { key: 'confusing',   label: 'Too complicated or confusing' },
  { key: 'alternative', label: 'Found something else I like better' },
  { key: 'privacy',     label: 'Privacy or data concerns' },
  { key: 'bugs',        label: 'Too many bugs or technical issues' },
  { key: 'other',       label: 'Other' },
];

// The one truly irreversible action in this screen — everything else here
// is a toggle or a sign-out. Alert.alert's two-button confirm is what Sign
// Out uses, but that's one accidental tap away from firing; this needs a
// harder gate, so it's a real two-step Modal: an optional "why are you
// leaving" step first, then a step requiring the user to type DELETE
// before the button even enables.
// Deleting the account doesn't touch a subscription bought through Apple or
// Google: billing goes on until it's cancelled in that store, and Apple asks
// apps to say so before deletion. Shown only while Plus is set to renew.
function storeLabel(store) {
  if (store === 'app_store' || store === 'mac_app_store') return 'the App Store';
  if (store === 'play_store') return 'Google Play';
  return 'the store you bought it in';
}

function DeleteAccountModal({ visible, onClose, onConfirm, deleting, c, t, s, r }) {
  const plus = usePlus();
  const renewingPlus = plus.hasPlus && plus.plan?.willRenew !== false && plus.plan?.store !== 'promotional';
  const [step,        setStep]        = useState('feedback'); // 'feedback' | 'confirm'
  const [reason,      setReason]      = useState(null);
  const [details,     setDetails]     = useState('');
  const [confirmText, setConfirmText] = useState('');
  useEffect(() => {
    if (visible) { setStep('feedback'); setReason(null); setDetails(''); setConfirmText(''); }
  }, [visible]);
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40, maxHeight: '88%' }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />

          {step === 'feedback' ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md }}>
                <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>We're sad to see you go 😢</Text>
                <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
              </View>
              <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, marginBottom: s.lg }}>
                Mind telling us why? Totally optional — it just helps us improve.
              </Text>

              <ScrollView automaticallyAdjustKeyboardInsets style={{ marginBottom: s.md }}>
                <View style={{ gap: s.sm }}>
                  {DELETION_REASONS.map(opt => {
                    const active = reason === opt.key;
                    return (
                      <TouchableOpacity key={opt.key} onPress={() => setReason(active ? null : opt.key)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: s.sm, padding: s.md, borderRadius: r.md, borderWidth: 1, borderColor: active ? c.teal : c.border, backgroundColor: active ? c.teal + '18' : c.bg0 }}>
                        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: active ? c.teal : c.text4, alignItems: 'center', justifyContent: 'center' }}>
                          {active && <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: c.teal }} />}
                        </View>
                        <Text style={{ fontSize: t.sm, color: active ? c.teal : c.text2, fontWeight: active ? t.semibold : t.regular }}>{opt.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Eyebrow style={{ marginTop: s.lg, marginBottom: s.sm }}>
                  Anything else? (optional)
                </Eyebrow>
                <TextInput
                  value={details}
                  onChangeText={setDetails}
                  placeholder="Tell us more..."
                  placeholderTextColor={c.text4}
                  multiline
                  style={{ fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 1, borderColor: c.border, padding: s.md, minHeight: 70, textAlignVertical: 'top' }}
                />
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: s.sm, marginTop: s.sm }}>
                <TouchableOpacity onPress={() => { setReason(null); setDetails(''); setStep('confirm'); }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: r.md, borderWidth: 1, borderColor: c.border }}>
                  <Text style={{ color: c.text3, fontWeight: t.semibold, fontSize: t.sm }}>Skip</Text>
                </TouchableOpacity>
                <Button label="Continue" onPress={() => setStep('confirm')} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md }}>
                <TouchableOpacity onPress={() => setStep('feedback')} disabled={deleting} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chevron-back" size={18} color={c.text3} />
                  <Text style={{ fontSize: t.sm, color: c.text3 }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose} disabled={deleting}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
              </View>
              <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.error, marginBottom: s.md }}>Delete Account</Text>
              <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginBottom: s.lg }}>
                This permanently deletes your account and everything in it — projects, planner, notes,
                research, portfolio, garden, progress, all of it. There's no undo.
              </Text>
              {renewingPlus && (
                <View accessibilityRole="alert" style={{ backgroundColor: c.gold + '18', borderColor: c.gold, borderWidth: 1, borderRadius: r.md, padding: s.md, marginBottom: s.lg }}>
                  <Text style={{ fontSize: t.sm, color: c.text1, lineHeight: 20, fontWeight: t.semibold }}>
                    Your Plus subscription keeps billing
                  </Text>
                  <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginTop: 4 }}>
                    Deleting your account doesn't cancel Plus. Cancel it in {storeLabel(plus.plan?.store)} first, or you'll keep being charged.
                  </Text>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(plus.manageUrl())}
                    accessibilityRole="link"
                    style={{ marginTop: s.sm, alignSelf: 'flex-start', paddingVertical: 4 }}
                  >
                    <Text style={{ fontSize: t.sm, color: c.teal, fontWeight: t.bold }}>Manage subscription</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Eyebrow style={{ marginBottom: s.sm }}>
                Type DELETE to confirm
              </Eyebrow>
              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="DELETE"
                placeholderTextColor={c.text4}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!deleting}
                style={{ fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 1, borderColor: canDelete ? c.error : c.border, padding: s.md, marginBottom: s.lg }}
              />
              <Button
                label="Permanently Delete My Account"
                onPress={() => onConfirm({ reason, details })}
                disabled={!canDelete}
                busy={deleting}
                color={c.error}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Bring-your-own Anthropic key for the Import Hub's AI parsing. Stored on
// this device only (SecureStore/Keychain on iOS+Android, AsyncStorage on
// web) — never sent anywhere but api.anthropic.com from your own device.
// One-time birth date for accounts made before onboarding asked for it. The
// Discover screens send people here ("add it in Settings"), so this row
// exists only while the date is missing — once saved it isn't editable in the
// app, since it decides what an account can see.
function BirthDateModal({ visible, onClose, onSave, saving, c, t, s, r }) {
  const [mm, setMm] = useState('');
  const [dd, setDd] = useState('');
  const [yyyy, setYyyy] = useState('');
  useEffect(() => { if (visible) { setMm(''); setDd(''); setYyyy(''); } }, [visible]);
  const input = { fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 1, borderColor: c.border, padding: s.md, textAlign: 'center' };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: c.bg1, borderTopLeftRadius: r.xl, borderTopRightRadius: r.xl, padding: s.xl, paddingBottom: 40 }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginBottom: s.lg }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.sm }}>
            <Text style={{ fontSize: t.lg, fontWeight: '800', color: c.text1 }}>Your birth date</Text>
            <TouchableOpacity accessibilityLabel="Close" accessibilityRole="button" onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, marginBottom: s.lg }}>
            It decides which parts of the app fit your age. You can add it once; after that it can't be changed here.
          </Text>
          <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
            <TextInput style={[input, { flex: 1 }]} placeholder="MM" placeholderTextColor={c.text4} value={mm} onChangeText={setMm} keyboardType="number-pad" maxLength={2} />
            <TextInput style={[input, { flex: 1 }]} placeholder="DD (opt.)" accessibilityLabel="Birth day, optional" placeholderTextColor={c.text4} value={dd} onChangeText={setDd} keyboardType="number-pad" maxLength={2} />
            <TextInput style={[input, { flex: 1.6 }]} placeholder="YYYY" placeholderTextColor={c.text4} value={yyyy} onChangeText={setYyyy} keyboardType="number-pad" maxLength={4} />
          </View>
          <Button label="Save" onPress={() => onSave({ mm, dd, yyyy })} busy={saving} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SettingsScreen() {
  const navigation  = useNavigation();
  const route       = useRoute();
  const { colors: c, typography: t, spacing: s, radius: r, style: ui } = useTheme();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [signingOut,setSigningOut] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useSetting(SETTING_KEYS.DAILY_REMINDERS_ENABLED, false);
  // The pet's "getting hungry" reminder. On by default; same switch as the
  // pet's feed sheet.
  const [petRemindOn, setPetRemindOn] = useSetting(SETTING_KEYS.PET_REMINDERS, true);
  // Plan state for the Plus row. Everything else Settings used to read from
  // here (stage, track, Labs, Educator Mode) is on Make it yours.
  const { isPlus, plusOnSale } = useAccess();
  const [userId, setUserId] = useState(null);
  const [showCrestModal, setShowCrestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { dailyMissions, profile: liveProfile, streakDays, refreshProfile, user: progressUser } = useUserProgress();
  const petCare = usePetCare(progressUser?.id);
  // Jump links at the top: this is one long page (~170 rows), and Sign out
  // sat five screens down. Section offsets are measured as they lay out.
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const sectionNode = useRef({});
  const markSection = (key) => ({
    ref: (n) => { sectionNode.current[key] = n; },
    onLayout: (e) => { sectionY.current[key] = e.nativeEvent.layout.y; },
  });
  const jumpTo = (key) => {
    // On web the page scrolls rather than the ScrollView, so let the browser find the section.
    const node = sectionNode.current[key];
    if (Platform.OS === 'web' && node?.scrollIntoView) { node.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const y = sectionY.current[key];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };
  // Other screens link straight to a section: { section: 'reminders' }.
  const sectionParam = route?.params?.section;
  useEffect(() => {
    if (!sectionParam) return undefined;
    const timer = setTimeout(() => { jumpTo(sectionParam); navigation.setParams({ section: undefined }); }, 600);
    return () => clearTimeout(timer);
  }, [sectionParam]); // eslint-disable-line react-hooks/exhaustive-deps
  const [showDobModal, setShowDobModal] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [savingDob, setSavingDob] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const { startTour } = useTour();
  const { showEmojis } = useUIPrefs();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const cacheKey = `settings_profile_${user.id}`;

      const cached = await cacheRead(cacheKey);
      if (cached) setProfile(cached);

      if (await isOnline()) {
        const { data } = await supabase.from('profiles')
          .select('display_name, email, level, xp, points, streak_count, active_life_areas, suit_color, badge')
          .eq('id', user.id).maybeSingle();
        const next = { ...data, email: user.email };
        setProfile(next);
        cacheWrite(cacheKey, next);
      }
      setLoading(false);
    });
  }, []);

  const saveCrest = async (color, badge) => {
    setProfile(prev => ({ ...prev, suit_color: color, badge }));
    setShowCrestModal(false);
    if (!userId) return;
    await supabase.from('profiles').update({ suit_color: color, badge }).eq('id', userId);
  };

  const toggleReminders = async (v) => {
    setRemindersEnabled(v);
    if (!v) { cancelAllReminders(); return; }
    const { tasksAllComplete, checkedInToday } = computeReminderState({ dailyMissions, profile: liveProfile });
    const granted = await syncReminders({ enabled: true, tasksAllComplete, checkedInToday });
    if (!granted) {
      // OS permission was actually denied — don't leave the toggle showing
      // "on" while nothing is really scheduled.
      setRemindersEnabled(false);
      Alert.alert('Notifications blocked', 'Enable notifications for this app in your device Settings to use reminders.');
    }
  };

  const togglePetReminders = async (v) => {
    setPetRemindOn(v);
    if (!v) { cancelPetReminder(); return; }
    const pet = await readEquippedPet({ level: liveProfile?.level || 1, played: 1 });
    const ok = await syncPetReminder({ fullUntil: petCare.fullUntil, name: petCare.nickname || pet?.name, enabled: true, ask: true });
    if (ok === false) {
      setPetRemindOn(false);
      Alert.alert('Notifications blocked', 'Enable notifications for this app in your device Settings to use reminders.');
    }
  };

  // confirmAsync: Alert.alert with buttons does nothing on web, so this
  // button used to do nothing at all in the browser.
  const signOut = async () => {
    if (!(await confirmAsync('Sign out?', 'You can sign back in any time. Nothing is deleted.', 'Sign out'))) return;
    setSigningOut(true);
    // Leaves nothing of this person on the device (cache, queue, drafts, key).
    await signOutAndClear();
    // reset(), not replace() — replace() only swaps the current
    // (Settings) entry; MainTabs is still sitting underneath it in
    // history, so swiping back after signing out would land right back
    // on an authenticated screen. reset() clears the whole stack.
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const exportData = async () => {
    setExportingData(true);
    try {
      await shareMyDataExport();
    } catch (e) {
      console.warn('exportData', e);
      Alert.alert("Couldn't export your data", e.message || 'Something went wrong — try again.');
    } finally {
      setExportingData(false);
    }
  };

  const saveBirthDate = async ({ mm, dd, yyyy }) => {
    // Month + year required, day optional — same rule as onboarding.
    const dateOfBirth = dobFromParts(mm, dd, yyyy);
    if (!dateOfBirth) { Alert.alert('Check your birth date', dobProblem(mm, dd, yyyy).replace(/\*\*/g, '')); return; }
    const isMinor = isMinorRequiringConsent(dateOfBirth, liveProfile?.country_code || 'US');

    setSavingDob(true);
    try {
      // Needs parental consent: send them back through onboarding's age gate,
      // the one place that handles it, rather than a second copy of that flow.
      // is_minor is derived server-side from the birth date (20260927120000);
      // route on the saved value rather than the local guess.
      const { data: saved, error } = await supabase.from('profiles')
        .update({ date_of_birth: dateOfBirth, is_minor: isMinor, ...(isMinor && { onboarding_completed: false }) })
        .eq('id', userId)
        .is('date_of_birth', null)
        .select('is_minor')
        .maybeSingle();
      if (error) throw error;
      setShowDobModal(false);
      await refreshProfile?.();
      const minor = typeof saved?.is_minor === 'boolean' ? saved.is_minor : isMinor;
      if (minor) navigation.reset({ index: 0, routes: [{ name: 'MultiStepOnboarding' }] });
    } catch (e) {
      Alert.alert('Save error', e.message || 'Could not save your birth date.');
    } finally {
      setSavingDob(false);
    }
  };

  // supabase/migrations/20260906150000_delete_account.sql's delete_my_account()
  // deletes auth.users, which cascades through every table that references
  // public.profiles(id) on delete cascade. If any table's FK doesn't
  // cascade, that whole delete rolls back — the RPC errors, nothing is
  // touched, and the user sees the error below instead of a half-deleted
  // account.
  const deleteAccount = async ({ reason, details } = {}) => {
    setDeletingAccount(true);
    try {
      // Best-effort and must happen before delete_my_account() — once that
      // runs, the user is no longer authenticated and submit_deletion_feedback
      // (which requires auth.uid()) would fail. A feedback failure here
      // shouldn't block the deletion itself, so it's swallowed rather than
      // thrown — see supabase/migrations/20260906160000_account_deletion_feedback.sql.
      if (reason) {
        // supabase.rpc() returns a thenable query builder, not a real
        // Promise — it has no .catch()/.finally(), only .then(), so
        // chaining .catch() directly on it throws "undefined is not a
        // function" instead of catching anything. await + try/catch (or
        // checking the returned `error`) is the only safe way to swallow
        // a failure here.
        try {
          await supabase.rpc('submit_deletion_feedback', { p_reason: reason, p_details: details || null });
        } catch (e) {
          console.warn('submit_deletion_feedback', e);
        }
      }

      const { error } = await supabase.rpc('delete_my_account');
      if (error) {
        if (error.code === '42883') {
          Alert.alert('Not set up yet', "Account deletion needs a one-time database update that hasn't been applied yet — try again later.");
        } else {
          Alert.alert("Couldn't delete your account", error.message || 'Something went wrong — try again.');
        }
        setDeletingAccount(false);
        return;
      }
      await cancelAllReminders();
      await clearLocalUserData(userId);
      await supabase.auth.signOut();
      setShowDeleteModal(false);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      console.warn('deleteAccount', e);
      Alert.alert("Couldn't delete your account", 'Something went wrong — try again.');
      setDeletingAccount(false);
    }
  };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: c.bg0, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={c.teal} />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg0 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ backgroundColor: c.bg1, padding: s.lg, paddingTop: s.xxl, borderBottomWidth: 0.5, borderBottomColor: c.border, flexDirection: 'row', alignItems: 'center', gap: s.md }}>
        <TouchableOpacity accessibilityLabel="Back" accessibilityRole="button" onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{showEmojis ? '⚙️ ' : ''}Settings</Text>
      </View>

      <ScrollView ref={scrollRef} automaticallyAdjustKeyboardInsets contentContainerStyle={{ padding: s.lg, paddingBottom: 140 }}>
        {/* Account card */}
        {profile && (() => {
          const rank = getRank(profile.points || 0);
          const { progress } = getTierProgress(profile.points || 0);
          const rankInfo = RANK_LABELS[rank] || RANK_LABELS[20];
          return (
            <View style={{ backgroundColor: c.bg1, borderRadius: ui.cardRadius, padding: s.xl, marginBottom: s.lg, borderWidth: ui.borderWidth, borderColor: c.border, borderTopWidth: 2, borderTopColor: c.gold, alignItems: 'center' }}>
              <LevelRing pct={progress} size={72} strokeWidth={5} color={c.gold} trackColor={c.bg2} style={{ marginBottom: s.md }}>
                <Text style={{ fontSize: 30 }}>{rankInfo.emoji}</Text>
              </LevelRing>
              <Text style={{ fontSize: t.xl, fontFamily: ui.titleFont, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>
                {profile.display_name || 'You'}
              </Text>
              <Text style={{ fontSize: t.xs, fontFamily: ui.numberFont, fontWeight: t.semibold, color: c.gold, marginBottom: 4 }}>
                LV {profile.level || 1} · {rankInfo.label}
              </Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginBottom: s.md }}>{profile.email}</Text>
              <View style={{ flexDirection: 'row', gap: s.lg }}>
                {[
                  { label: 'Points', val: (profile.points || 0).toLocaleString(), color: c.gold  },
                  { label: 'XP',     val: profile.xp || 0,                        color: c.teal  },
                  // Same computed streak Home shows (useUserProgress().streakDays) —
                  // this used to read profile.streak_count directly from its own
                  // separate fetch, a raw DB column nothing actually increments day
                  // to day, so it drifted from what Home displayed for the same account.
                  { label: 'Streak', val: (streakDays || 0) + 'd',                 color: c.warning },
                ].map(st => (
                  <View key={st.label} style={{ alignItems: 'center' }}>
                    <Readout size={t.lg} color={st.color}>{st.val}</Readout>
                    <Text style={{ fontSize: t.xs, fontFamily: ui.numberFont, color: c.text3 }}>{st.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Jump links. How the app looks and what is in it moved to Make it
            yours (2026-10-16): it was half here and half there, some of it two
            different switches for one setting. Settings is the account,
            reminders, privacy and help. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm, marginBottom: s.md }}>
          {[['reminders', 'Reminders'], ['privacy', 'Privacy'], ['help', 'Help'], ['account', 'Account']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => jumpTo(key)}
              accessibilityRole="button"
              accessibilityLabel={`Jump to ${label}`}
              style={{ paddingHorizontal: s.md, paddingVertical: 8, minHeight: 36, justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.bg1 }}
            >
              <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text2 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TourSpot id="settings-appearance">
        <SettingRow icon="color-palette-outline" iconColor={c.teal} label="Make it yours"
          subtitle="Look, Home, Library, features, life areas and your character"
          alwaysShowSubtitle
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('MakeItYours')}
          c={c} t={t} s={s} r={r} />
        </TourSpot>
        <SettingRow icon="accessibility-outline" iconColor={c.teal} label="Easier to read and use"
          subtitle="Text size, bold, contrast and motion"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('MakeItYours', { section: 'accessibility' })}
          c={c} t={t} s={s} r={r} />
        {(plusOnSale || isPlus) && <SettingRow
          icon={isPlus ? 'star' : 'star-outline'}
          iconColor={c.gold}
          label={isPlus ? 'Plus' : 'Free plan'}
          subtitle={isPlus
            ? 'Business courses and Organizations are included. Manage your plan here.'
            : 'Get Plus for the business courses and Organizations. Everything else works the same on the free plan.'}
          alwaysShowSubtitle
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Plus')}
          c={c} t={t} s={s} r={r}
        />}

        {/* Profile */}
        <SectionLabel label="Profile" c={c} t={t} s={s} />
        <SettingRow icon="person-outline" iconColor={c.teal} label="Edit Profile" subtitle="Update your display name, bio, and avatar"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Profile')}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="color-palette-outline" iconColor={c.purple} label="Crest" subtitle="Crest color and role badge shown on Home & Portfolio"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => setShowCrestModal(true)}
          c={c} t={t} s={s} r={r} />
        <TourSpot id="settings-family">
        <SettingRow icon="people-outline" iconColor={c.warning} label="Family" subtitle="Link a parent/child account to follow progress"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Family')}
          c={c} t={t} s={s} r={r} />
        </TourSpot>
        <TourSpot id="settings-organization">
        <SettingRow icon="school-outline" iconColor={c.tealMid} label="Organization" subtitle="Manage or join a class, team, or group"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Organization')}
          c={c} t={t} s={s} r={r} />
        </TourSpot>

        {/* Moderation — only for accounts flagged is_admin. The RPCs behind
            this screen re-check that flag and raise NOT_AN_ADMIN, so hiding the
            row is presentation rather than access control. */}
        {liveProfile?.is_admin === true && (
          <SettingRow icon="shield-checkmark-outline" iconColor={c.error} label="Moderation"
            subtitle="Review reported and filtered community posts"
            right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
            onPress={() => navigation.navigate('Library', { screen: 'ModerationQueueScreen' })}
            c={c} t={t} s={s} r={r} />
        )}

        {/* Reminders (Make it yours links here: { section: 'reminders' }) */}
        <View {...markSection('reminders')}><SectionLabel label="Reminders" c={c} t={t} s={s} /></View>
        <SettingRow icon="notifications-outline" iconColor={c.success} label="Daily Reminders" subtitle="Evening nudges for today's drills and your next step"
          right={
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: c.borderStrong, true: c.teal + '88' }}
              thumbColor={remindersEnabled ? c.teal : c.text3}
            />
          }
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="paw-outline" iconColor={c.gold} label="Pet reminders" subtitle="A nudge when your pet is down to its last heart"
          right={
            <Switch
              value={petRemindOn !== false}
              onValueChange={togglePetReminders}
              trackColor={{ false: c.borderStrong, true: c.teal + '88' }}
              thumbColor={petRemindOn !== false ? c.teal : c.text3}
            />
          }
          c={c} t={t} s={s} r={r} />

        {/* Data */}
        <View {...markSection('privacy')}><SectionLabel label="Data & Privacy" c={c} t={t} s={s} /></View>
        {userId && !liveProfile?.date_of_birth && (
          <SettingRow icon="calendar-outline" iconColor={c.warning} label="Birth Date" subtitle="Not added yet. Some features need it"
            alwaysShowSubtitle
            right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
            onPress={() => setShowDobModal(true)}
            c={c} t={t} s={s} r={r} />
        )}
        {/* Opens the Digital life area's privacy checklist — tips for your own
            online privacy, not settings for this app — so it's labelled that way. */}
        <SettingRow icon="shield-checkmark-outline" iconColor={c.math} label="Privacy Checkup" subtitle="Your digital-privacy checklist"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Library', params: { screen: 'PrivacyScreen' } })}
          c={c} t={t} s={s} r={r} />
        {userId && (
          <SettingRow icon="shield-checkmark-outline" iconColor={c.teal} label="Two-step sign-in"
            subtitle="Ask for a code from an authenticator app when signing in"
            onPress={() => setShow2fa(true)}
            c={c} t={t} s={s} r={r} />
        )}
        {userId && (
          <SettingRow icon="download-outline" iconColor={c.gold} label="Export My Data" subtitle="A copy of everything this account has stored"
            right={exportingData ? <ActivityIndicator color={c.text4} size="small" /> : <Ionicons name="share-outline" size={16} color={c.text4} />}
            onPress={exportingData ? undefined : exportData}
            c={c} t={t} s={s} r={r} />
        )}

        {/* Help. The tips-on-new-screens switch is on Make it yours. */}
        <View {...markSection('help')}><SectionLabel label="Help" c={c} t={t} s={s} /></View>
        <SettingRow icon="school-outline" iconColor={c.purple} label="Replay Tutorial" subtitle="Take the guided tour of the app's features again"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => { navigation.navigate('MainTabs'); setTimeout(startTour, 300); }}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="refresh-outline" iconColor={c.purple} label="Show All Tutorials Again"
          subtitle="Forget which screens you've already seen a walkthrough for"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => {
            Alert.alert(
              'Show all tutorials again?',
              "Every screen will walk you through itself once more, the next time you open it.",
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Show again',
                  onPress: async () => {
                    await resetSeenScreens();
                    Alert.alert('Done', "Screen tutorials will show again as you move around the app.");
                  },
                },
              ],
            );
          }}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="mail-outline" iconColor={c.teal} label="Contact support" subtitle={`${SUPPORT_EMAIL} · account, billing and bugs`}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Deskartes support')}`)}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="information-circle-outline" iconColor={c.teal} label="App Version" subtitle="Deskartes · ChillTech Hub LLC"
          right={<Text style={{ fontSize: t.xs, color: c.text3 }}>v1.0.0</Text>}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="globe-outline" iconColor={c.math} label="Privacy Policy"
          right={<Ionicons name="open-outline" size={16} color={c.text4} />}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          c={c} t={t} s={s} r={r} />
        {TERMS_URL ? (
          <SettingRow icon="document-text-outline" iconColor={c.math} label="Terms of Service"
            right={<Ionicons name="open-outline" size={16} color={c.text4} />}
            onPress={() => Linking.openURL(TERMS_URL)}
            c={c} t={t} s={s} r={r} />
        ) : null}

        {/* Sign out */}
        <View {...markSection('account')}><SectionLabel label="Account" c={c} t={t} s={s} /></View>
        <TouchableOpacity onPress={signOut} disabled={signingOut}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, backgroundColor: c.error + '18', borderRadius: r.md, padding: s.lg, borderWidth: 1, borderColor: c.error + '44' }}>
          {signingOut
            ? <ActivityIndicator color={c.error} size="small" />
            : <>
                <Ionicons name="log-out-outline" size={18} color={c.error} />
                <Text style={{ color: c.error, fontWeight: t.bold, fontSize: t.sm }}>Sign Out</Text>
              </>
          }
        </TouchableOpacity>

        <SectionLabel label="Danger Zone" c={c} t={t} s={s} />
        <TouchableOpacity onPress={() => setShowDeleteModal(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, borderRadius: r.md, padding: s.lg, borderWidth: 1, borderColor: c.error + '44' }}>
          <Ionicons name="trash-outline" size={16} color={c.error} />
          <Text style={{ color: c.error, fontWeight: t.semibold, fontSize: t.xs }}>Delete Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <CrestModal
        visible={showCrestModal}
        crestColor={profile?.suit_color || 'teal'}
        roleBadge={profile?.badge || 'explorer'}
        onClose={() => setShowCrestModal(false)}
        onSave={saveCrest}
        c={c} t={t} s={s} r={r}
      />

      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteAccount}
        deleting={deletingAccount}
        c={c} t={t} s={s} r={r}
      />
      <TwoFactorSheet visible={show2fa} onClose={() => setShow2fa(false)} />
      <BirthDateModal
        visible={showDobModal}
        onClose={() => setShowDobModal(false)}
        onSave={saveBirthDate}
        saving={savingDob}
        c={c} t={t} s={s} r={r}
      />
    </KeyboardAvoidingView>
  );
}
