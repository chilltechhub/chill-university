// src/screens/SettingsScreen.js
// App settings — theme toggle controls app-wide dark/light mode

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator, TextInput, Linking, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUIPrefs } from '../../context/UIPrefsContext';
import { supabase } from '../api/supabaseClient';
import { cacheRead, cacheWrite, isOnline } from '../api/offlineCache';
import { RANK_LABELS, FONTS, STYLES, ACCENTS } from '../theme';
import LevelRing from '../components/LevelRing';
import { getRank, getRankProgress } from '../logic/rankUtils';
import { getUserApiKey, setUserApiKey, clearUserApiKey, maskKey } from '../api/aiKey';
import useSetting, { SETTING_KEYS } from '../logic/useSetting';
import { resetSeenScreens } from '../logic/useFirstVisitTutorial';
import { useFabPosition } from '../../context/FabPositionContext';
import { syncReminders, cancelAllReminders, computeReminderState } from '../logic/notificationScheduler';
import { useUserProgress } from '../../context/UserProgressContext';
import { useTour } from '../../context/TourContext';
import TourSpot from '../components/TourSpot';
import { LIFE_AREAS } from './library/LifeAreaScreen';
import { LIBRARY_HUBS } from './library/LibraryScreen';
import { CREST_COLORS, ROLE_BADGES } from '../data/crestOptions';
import { useAccess } from '../../context/AccessContext';
import { useProfiles } from '../../context/ProfileAccountsContext';
import { FEATURES } from '../data/featureCatalog';
import { stageMeta } from '../logic/experienceStage';
import { MAX_STAGE } from '../data/experienceStages';
import { PRIVACY_POLICY_URL, TERMS_URL } from '../config/legal';
import { shareMyDataExport } from '../api/dataExport';
import { isMinorRequiringConsent } from '../logic/ageOfConsent';

// `alwaysShowSubtitle` is for the Show Emojis / Show Subtitles rows
// themselves — hiding the explanation of what "show subtitles" does the
// instant you turn it off would bury the very control you'd need to turn
// it back on.
function SettingRow({ icon, iconColor, label, subtitle, right, onPress, c, t, s, r, alwaysShowSubtitle = false }) {
  const { showSubtext } = useUIPrefs();
  const { style } = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: style.cardRadius, padding: s.lg, marginBottom: s.sm, borderWidth: style.borderWidth, borderColor: c.border }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconColor + '22', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{label}</Text>
        {subtitle && (alwaysShowSubtitle || showSubtext) && <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress} activeOpacity={0.8}>{content}</TouchableOpacity> : content;
}

// A one-line tally of what's open and what isn't. Deliberately a count
// rather than a list: the list is the Compass's job, and reproducing it
// here would rebuild the wall of options in the one screen people already
// open when they feel lost.
function UnlockSummary({ accessFor, c, t, s, r, onPress }) {
  // Counts only doors that are on show. A Plus door before Plus is on sale
  // is hidden (it has no key), so counting it would be a tally of things
  // nobody can see or open.
  const gated = FEATURES
    .filter(f => f.gate !== 'open')
    .map(f => accessFor(f.id))
    .filter(a => a.available || !a.hidden || a.gate === 'experimental');
  const open = gated.filter(a => a.available).length;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-open-outline" size={18} color={c.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>{open} of {gated.length} unlocked</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>
            {open === gated.length
              ? 'Everything is open.'
              : 'The Compass lists what each one needs: an objective, a check, or a switch.'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={c.text4} />
      </View>
    </TouchableOpacity>
  );
}

function SectionLabel({ label, c, t, s }) {
  const { style } = useTheme();
  return <Text style={{ fontSize: t.xs, color: style.name === 'plain' ? c.text3 : c.text4, ...style.sectionLabel, marginBottom: s.sm, marginTop: s.lg, paddingHorizontal: 2 }}>{label}</Text>;
}

// Mode / Style / Accent — the three appearance choices, all in ThemeContext.
const MODE_OPTIONS = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
];

function AppearancePicker({ c, t, s }) {
  const { mode, setMode, styleName, setStyle, accentName, setAccent, accent, style, isDark } = useTheme();
  const box = { backgroundColor: c.bg1, borderRadius: style.cardRadius, padding: s.lg, marginBottom: s.sm, borderWidth: style.borderWidth, borderColor: c.border };
  const heading = { fontSize: t.sm, fontWeight: t.semibold, color: c.text1, marginBottom: s.sm };
  return (
    <View style={box}>
      <Text style={heading}>Mode</Text>
      <View style={{ flexDirection: 'row', backgroundColor: c.bg2, borderRadius: style.buttonRadius, padding: 3, marginBottom: s.lg }}>
        {MODE_OPTIONS.map(m => {
          const on = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => setMode(m.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: style.buttonRadius - 2, backgroundColor: on ? c.bg1 : 'transparent' }}
            >
              <Ionicons name={m.icon} size={15} color={on ? accent.primary : c.text3} />
              <Text style={{ fontSize: t.sm, fontWeight: on ? t.semibold : t.medium, color: on ? c.text1 : c.text3 }}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={heading}>Style</Text>
      <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
        {Object.values(STYLES).map(st => {
          const on = styleName === st.name;
          return (
            <TouchableOpacity
              key={st.name}
              onPress={() => setStyle(st.name)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={{ flex: 1, borderRadius: st.cardRadius, borderWidth: on ? 2 : 1, borderColor: on ? accent.primary : c.border, backgroundColor: c.bg0, padding: s.md }}
            >
              {/* A tiny sample of the style itself: its label and a card. */}
              <Text style={{ fontSize: 10, color: c.text3, ...st.sectionLabel }}>{st.name === 'plain' ? 'Today' : 'TODAY'}</Text>
              <View style={{ marginTop: 6, height: 22, borderRadius: st.cardRadius / 2, backgroundColor: c.bg1, borderWidth: st.borderWidth, borderColor: c.border, justifyContent: 'center', paddingHorizontal: 8 }}>
                <View style={{ width: '60%', height: 5, borderRadius: 3, backgroundColor: c.text4 }} />
              </View>
              <Text style={{ marginTop: s.sm, fontSize: t.sm, fontWeight: t.semibold, color: c.text1, fontFamily: st.titleFont }}>{st.label}</Text>
              <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>{st.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={heading}>Accent</Text>
      <View style={{ flexDirection: 'row', gap: s.lg }}>
        {Object.entries(ACCENTS).map(([key, a]) => {
          const on = accentName === key;
          const swatch = a[isDark ? 'dark' : 'light'].primary;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setAccent(key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${a.label} accent`}
              accessibilityState={{ selected: on }}
              style={{ alignItems: 'center', gap: 4 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: on ? swatch : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: swatch, alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Ionicons name="checkmark" size={15} color={a[isDark ? 'dark' : 'light'].onPrimary} />}
                </View>
              </View>
              <Text style={{ fontSize: t.xs, color: on ? c.text1 : c.text3 }}>{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// 2x2 grid, laid out the way the corners actually sit on screen.
const FAB_POSITIONS = [
  { key: 'top-left',     label: 'Top Left' },
  { key: 'top-right',    label: 'Top Right' },
  { key: 'bottom-left',  label: 'Bottom Left' },
  { key: 'bottom-right', label: 'Bottom Right' },
];

function FabPositionPicker({ value, onChange, c, t, s, r }) {
  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="apps-outline" size={18} color={c.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Quick Actions Button</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Choose where the floating + button sits</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {FAB_POSITIONS.map(pos => {
          const active = value === pos.key;
          return (
            <TouchableOpacity
              key={pos.key}
              onPress={() => onChange(pos.key)}
              style={{
                flexGrow: 1, minWidth: '45%', alignItems: 'center', justifyContent: 'center',
                paddingVertical: s.sm + 2, borderRadius: r.md, borderWidth: 1,
                borderColor: active ? c.teal : c.border,
                backgroundColor: active ? c.teal + '18' : c.bg0,
              }}
            >
              <Text style={{ fontSize: t.xs, fontWeight: '700', color: active ? c.teal : c.text3 }}>{pos.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Which Library life-area bubbles are showing — same field onboarding's
// "Sectors" step writes (profiles.active_life_areas), editable here too so
// "add them later" has an obvious home. LibraryScreen.js's own "+ Add"
// tile on the life-area grid writes the exact same column.
function LifeAreasPicker({ activeIds, onToggle, c, t, s, r }) {
  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.teal + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="grid-outline" size={18} color={c.teal} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Life Areas</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Which ones show up in your Library</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {LIFE_AREAS.map(area => {
          const active = activeIds.includes(area.id);
          return (
            <TouchableOpacity
              key={area.id}
              onPress={() => onToggle(area.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: active ? area.color : c.border, backgroundColor: active ? area.color + '18' : c.bg0 }}
            >
              <Text style={{ fontSize: 14 }}>{area.emoji}</Text>
              <Text style={{ fontSize: 12, color: active ? area.color : c.text3, fontWeight: active ? '700' : '400' }}>{area.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// Same AsyncStorage setting (SETTING_KEYS.HIDDEN_LIBRARY_SECTIONS) as
// onboarding's "Look & Layout" step and LibraryScreen.js's own filtering —
// whichever place changes it, the other picks it up.
function LibrarySectionsPicker({ hidden, onToggle, c, t, s, r }) {
  const allSections = LIBRARY_HUBS.flatMap(hub => hub.items);
  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.md }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.gold + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="apps-outline" size={18} color={c.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Library Sections</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Hide any you don't need</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
        {allSections.map(item => {
          const isHidden = hidden.includes(item.screen);
          return (
            <TouchableOpacity
              key={item.screen}
              onPress={() => onToggle(item.screen)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: isHidden ? c.border : c.gold, backgroundColor: isHidden ? c.bg0 : c.gold + '18', opacity: isHidden ? 0.5 : 1 }}
            >
              <Ionicons name={item.icon} size={13} color={isHidden ? c.text4 : c.gold} />
              <Text style={{ fontSize: 12, color: isHidden ? c.text4 : c.gold, fontWeight: isHidden ? '400' : '700' }}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
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
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>

          <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Crest color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: s.lg }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {CREST_COLORS.map(cc => (
                <TouchableOpacity key={cc.key} onPress={() => setColor(cc.key)} style={{ alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: cc.color, borderWidth: 3, borderColor: color === cc.key ? c.text1 : 'transparent' }} />
                  <Text style={{ fontSize: 9, color: color === cc.key ? c.text1 : c.text4 }}>{cc.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>Role badge</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: s.xl }}>
            {ROLE_BADGES.map(b => (
              <TouchableOpacity key={b.key} onPress={() => setBadge(b.key)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: badge === b.key ? c.teal : c.border, backgroundColor: badge === b.key ? c.teal + '22' : c.bg0 }}>
                <Text style={{ fontSize: 16 }}>{b.emoji}</Text>
                <Text style={{ fontSize: 12, color: badge === b.key ? c.teal : c.text3, fontWeight: badge === b.key ? '700' : '400' }}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={() => onSave(color, badge)} style={{ backgroundColor: c.teal, borderRadius: r.md, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.md }}>Save</Text>
          </TouchableOpacity>
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
function DeleteAccountModal({ visible, onClose, onConfirm, deleting, c, t, s, r }) {
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
                <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
              </View>
              <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, marginBottom: s.lg }}>
                Mind telling us why? Totally optional — it just helps us improve.
              </Text>

              <ScrollView style={{ marginBottom: s.md }}>
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

                <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginTop: s.lg, marginBottom: s.sm }}>
                  Anything else? (optional)
                </Text>
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
                <TouchableOpacity onPress={() => setStep('confirm')}
                  style={{ flex: 1, backgroundColor: c.teal, borderRadius: r.md, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.sm }}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.md }}>
                <TouchableOpacity onPress={() => setStep('feedback')} disabled={deleting} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="chevron-back" size={18} color={c.text3} />
                  <Text style={{ fontSize: t.sm, color: c.text3 }}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} disabled={deleting}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
              </View>
              <Text style={{ fontSize: t.lg, fontWeight: '800', color: '#e05858', marginBottom: s.md }}>Delete Account</Text>
              <Text style={{ fontSize: t.sm, color: c.text2, lineHeight: 20, marginBottom: s.lg }}>
                This permanently deletes your account and everything in it — projects, planner, notes,
                research, portfolio, garden, progress, all of it. There's no undo.
              </Text>
              <Text style={{ fontSize: t.xs, color: c.text4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: s.sm }}>
                Type DELETE to confirm
              </Text>
              <TextInput
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder="DELETE"
                placeholderTextColor={c.text4}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!deleting}
                style={{ fontSize: t.md, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 1, borderColor: canDelete ? '#e05858' : c.border, padding: s.md, marginBottom: s.lg }}
              />
              <TouchableOpacity
                onPress={() => onConfirm({ reason, details })}
                disabled={!canDelete || deleting}
                style={{ backgroundColor: '#e05858', borderRadius: r.md, paddingVertical: 14, alignItems: 'center', opacity: (!canDelete || deleting) ? 0.5 : 1 }}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '800', fontSize: t.md }}>Permanently Delete My Account</Text>
                }
              </TouchableOpacity>
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
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={22} color={c.text3} /></TouchableOpacity>
          </View>
          <Text style={{ fontSize: t.sm, color: c.text3, lineHeight: 20, marginBottom: s.lg }}>
            It decides which parts of the app fit your age. You can add it once; after that it can't be changed here.
          </Text>
          <View style={{ flexDirection: 'row', gap: s.sm, marginBottom: s.lg }}>
            <TextInput style={[input, { flex: 1 }]} placeholder="MM" placeholderTextColor={c.text4} value={mm} onChangeText={setMm} keyboardType="number-pad" maxLength={2} />
            <TextInput style={[input, { flex: 1 }]} placeholder="DD" placeholderTextColor={c.text4} value={dd} onChangeText={setDd} keyboardType="number-pad" maxLength={2} />
            <TextInput style={[input, { flex: 1.6 }]} placeholder="YYYY" placeholderTextColor={c.text4} value={yyyy} onChangeText={setYyyy} keyboardType="number-pad" maxLength={4} />
          </View>
          <TouchableOpacity onPress={() => onSave({ mm, dd, yyyy })} disabled={saving}
            style={{ backgroundColor: c.teal, borderRadius: r.md, padding: s.md, alignItems: 'center' }}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: t.bold, fontSize: t.sm }}>Save</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AIKeyCard({ c, t, s, r }) {
  const [savedKey, setSavedKey] = useState(null); // null = loading, '' = none saved
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getUserApiKey().then(k => setSavedKey(k || '')); }, []);

  const save = async () => {
    const key = draft.trim();
    if (!key.startsWith('sk-ant-')) {
      Alert.alert('That doesn’t look like an Anthropic key', 'Anthropic API keys start with "sk-ant-". Get one at console.anthropic.com.');
      return;
    }
    setSaving(true);
    await setUserApiKey(key);
    setSaving(false);
    setSavedKey(key);
    setDraft('');
    setEditing(false);
  };

  const remove = () => {
    Alert.alert('Remove your API key?', 'Imports will fall back to the app’s shared AI.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await clearUserApiKey(); setSavedKey(''); } },
    ]);
  };

  return (
    <View style={{ backgroundColor: c.bg1, borderRadius: r.md, padding: s.lg, marginBottom: s.sm, borderWidth: 0.5, borderColor: c.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.sm }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.gold + '22', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="key-outline" size={18} color={c.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: t.sm, fontWeight: t.semibold, color: c.text1 }}>Your Anthropic API Key</Text>
          <Text style={{ fontSize: t.xs, color: c.text3, marginTop: 2 }}>Used for Import Hub AI parsing — kept on this device only</Text>
        </View>
      </View>

      {savedKey === null ? (
        <ActivityIndicator size="small" color={c.gold} />
      ) : savedKey && !editing ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: t.sm, fontFamily: FONTS.mono, color: c.text2 }}>{maskKey(savedKey)}</Text>
          <View style={{ flexDirection: 'row', gap: s.md }}>
            <TouchableOpacity onPress={() => { setDraft(savedKey); setEditing(true); }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Change</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={remove}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.error }}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="sk-ant-..."
            placeholderTextColor={c.text4}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            style={{ fontSize: t.sm, color: c.text1, backgroundColor: c.bg0, borderRadius: r.md, borderWidth: 0.5, borderColor: c.border, padding: s.md, marginBottom: s.sm, fontFamily: FONTS.mono }}
          />
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: s.sm }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: c.teal }}>Get a key →</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={save}
              disabled={saving || !draft.trim()}
              style={{ flex: 1, backgroundColor: c.gold, borderRadius: r.md, paddingVertical: s.sm, alignItems: 'center', opacity: (saving || !draft.trim()) ? 0.5 : 1 }}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 12, fontWeight: '800', color: '#fff' }}>Save key</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const navigation  = useNavigation();
  const { colors: c, typography: t, spacing: s, radius: r } = useTheme();

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [signingOut,setSigningOut] = useState(false);
  const [heroTapEnabled, setHeroTapEnabled] = useSetting(SETTING_KEYS.HERO_TAP_TO_PROFILE, true);
  const [homeBgMode, setHomeBgMode] = useSetting(SETTING_KEYS.HOME_BACKGROUND, 'plain');
  const [libraryBgMode, setLibraryBgMode] = useSetting(SETTING_KEYS.LIBRARY_BACKGROUND, 'plain');
  const [remindersEnabled, setRemindersEnabled] = useSetting(SETTING_KEYS.DAILY_REMINDERS_ENABLED, false);
  const [screenTutorials, setScreenTutorials] = useSetting(SETTING_KEYS.SCREEN_TUTORIALS_ENABLED, true);
  const [hiddenSections, setHiddenSections] = useSetting(SETTING_KEYS.HIDDEN_LIBRARY_SECTIONS, []);
  // Compass — purpose, the active objective, the experimental opt-in and
  // plan state. Settings is where people come looking for "why can't I see
  // X", so the same switches the Compass offers live here too.
  const {
    purpose, activeObjective, accessFor, experimentalOn, setExperimental, isPlus,
    stage, nextStage, experienceMode, setExperienceMode, can, plusOnSale,
    doorSettings, setDoorSetting,
  } = useAccess();
  // Labs, Plus and the unlock tally arrive with the last stage ('doors').
  const showAll = can('doors');
  const { activeType } = useProfiles();
  // Educator Mode is a key to the Lesson Builder's door (featureCatalog's
  // `settingKey`), so it lives with the doors in AccessContext rather than
  // in a setting of its own the lock wouldn't know about. null = never
  // decided; the Switch treats that as off.
  const educatorMode = doorSettings?.educatorMode ?? null;
  const setEducatorMode = (on) => setDoorSetting('educatorMode', on);
  const [userId, setUserId] = useState(null);
  const [showCrestModal, setShowCrestModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { dailyMissions, profile: liveProfile, streakDays, refreshProfile } = useUserProgress();
  const [showDobModal, setShowDobModal] = useState(false);
  const [savingDob, setSavingDob] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const { startTour } = useTour();
  // Shared live context, not useSetting — the FAB itself (not a Screen, so
  // it never gets focus events) also needs to see this change immediately.
  const { fabPosition, setFabPosition } = useFabPosition();
  const { showEmojis, showSubtext, setShowEmojis, setShowSubtext } = useUIPrefs();

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

  const activeLifeAreaIds = profile?.active_life_areas?.length ? profile.active_life_areas : LIFE_AREAS.map(a => a.id);

  const toggleLifeArea = async (id) => {
    const cur = activeLifeAreaIds;
    const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id];
    setProfile(prev => ({ ...prev, active_life_areas: next }));
    if (!userId) return;
    const hidden = LIFE_AREAS.map(a => a.id).filter(aid => !next.includes(aid));
    await supabase.from('profiles').update({ active_life_areas: next, hidden_life_areas: hidden }).eq('id', userId);
  };

  const toggleLibrarySection = (screen) => {
    setHiddenSections(hiddenSections.includes(screen) ? hiddenSections.filter(x => x !== screen) : [...hiddenSections, screen]);
  };

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

  const signOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        // reset(), not replace() — replace() only swaps the current
        // (Settings) entry; MainTabs is still sitting underneath it in
        // history, so swiping back after signing out would land right back
        // on an authenticated screen. reset() clears the whole stack.
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }},
    ]);
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
    const m = parseInt(mm, 10), d = parseInt(dd, 10), y = parseInt(yyyy, 10);
    const dob = new Date(y, (m || 1) - 1, d || 1);
    const valid = y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31
      && dob <= new Date() && (new Date().getFullYear() - y) < 120;
    if (!valid) { Alert.alert('Check your birth date', 'Enter a valid month, day, and year.'); return; }
    const dateOfBirth = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isMinor = isMinorRequiringConsent(dateOfBirth, liveProfile?.country_code || 'US');

    setSavingDob(true);
    try {
      // Needs parental consent: send them back through onboarding's age gate,
      // the one place that handles it, rather than a second copy of that flow.
      const { error } = await supabase.from('profiles')
        .update({ date_of_birth: dateOfBirth, is_minor: isMinor, ...(isMinor && { onboarding_completed: false }) })
        .eq('id', userId)
        .is('date_of_birth', null);
      if (error) throw error;
      setShowDobModal(false);
      await refreshProfile?.();
      if (isMinor) navigation.reset({ index: 0, routes: [{ name: 'MultiStepOnboarding' }] });
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={22} color={c.teal} />
        </TouchableOpacity>
        <Text style={{ fontSize: t.xxl, fontWeight: t.bold, color: c.text1 }}>{showEmojis ? '⚙️ ' : ''}Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: s.lg, paddingBottom: 60 }}>
        {/* Account card */}
        {profile && (() => {
          const rank = getRank(profile.points || 0);
          const { progress } = getRankProgress(profile.points || 0);
          const rankInfo = RANK_LABELS[rank] || RANK_LABELS[20];
          return (
            <View style={{ backgroundColor: c.bg1, borderRadius: r.xl, padding: s.xl, marginBottom: s.lg, borderWidth: 0.5, borderColor: c.border, borderTopWidth: 2, borderTopColor: c.gold, alignItems: 'center' }}>
              <LevelRing pct={progress} size={72} strokeWidth={5} color={c.gold} trackColor={c.bg2} style={{ marginBottom: s.md }}>
                <Text style={{ fontSize: 30 }}>{rankInfo.emoji}</Text>
              </LevelRing>
              <Text style={{ fontSize: t.xl, fontFamily: FONTS.display, fontWeight: t.bold, color: c.text1, marginBottom: 2 }}>
                {profile.display_name || 'Commander'}
              </Text>
              <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, fontWeight: t.semibold, color: c.gold, marginBottom: 4 }}>
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
                  { label: 'Streak', val: (streakDays || 0) + 'd',                 color: '#FF4081' },
                ].map(st => (
                  <View key={st.label} style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: t.lg, fontFamily: FONTS.mono, fontWeight: t.bold, color: st.color }}>{st.val}</Text>
                    <Text style={{ fontSize: t.xs, fontFamily: FONTS.mono, color: c.text4 }}>{st.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Appearance */}
        <SectionLabel label="Appearance" c={c} t={t} s={s} />
        <TourSpot id="settings-appearance">
        <AppearancePicker c={c} t={t} s={s} />
        </TourSpot>
        <TourSpot id="settings-background">
        <SettingRow
          icon="image-outline"
          iconColor={c.teal}
          label="Home Background"
          subtitle="Match your equipped landscape instead of a plain background"
          right={
            <Switch
              value={homeBgMode === 'player'}
              onValueChange={(v) => setHomeBgMode(v ? 'player' : 'plain')}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={homeBgMode === 'player' ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <SettingRow
          icon="image-outline"
          iconColor={c.gold}
          label="Library Background"
          subtitle="Match your equipped landscape instead of a plain background"
          right={
            <Switch
              value={libraryBgMode === 'player'}
              onValueChange={(v) => setLibraryBgMode(v ? 'player' : 'plain')}
              trackColor={{ false: c.bg2, true: c.gold + '88' }}
              thumbColor={libraryBgMode === 'player' ? c.gold : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        </TourSpot>
        <SettingRow
          icon="happy-outline"
          iconColor={c.gold}
          label="Show Emojis"
          subtitle="Decorative emoji next to titles and labels throughout the app"
          alwaysShowSubtitle
          right={
            <Switch
              value={showEmojis}
              onValueChange={setShowEmojis}
              trackColor={{ false: c.bg2, true: c.gold + '88' }}
              thumbColor={showEmojis ? c.gold : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <SettingRow
          icon="reader-outline"
          iconColor={c.teal}
          label="Show Subtitles"
          subtitle="The description line under a screen's title"
          alwaysShowSubtitle
          right={
            <Switch
              value={showSubtext}
              onValueChange={setShowSubtext}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={showSubtext ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <FabPositionPicker value={fabPosition} onChange={setFabPosition} c={c} t={t} s={s} r={r} />

        {/* App experience — how much of the app is on show. First, because
            it's the answer to "where did X go?" for anyone not at the last
            stage. See src/data/experienceStages.js. */}
        <SectionLabel label="App experience" c={c} t={t} s={s} />
        <SettingRow
          icon="layers-outline"
          iconColor={c.teal}
          label={`Stage ${stage} of ${MAX_STAGE} · ${stageMeta(stage, activeType).label}`}
          subtitle={experienceMode === 'full'
            ? 'Everything is on show because you asked for it. Turn the switch below off and the app goes by your progress again.'
            : nextStage
              ? `The app opens a little at a time. ${nextStage.text} to open the next stage: ${nextStage.label}.`
              : 'Everything is on show.'}
          alwaysShowSubtitle
          c={c} t={t} s={s} r={r}
        />
        <SettingRow
          icon="eye-outline"
          iconColor={c.teal}
          label="Show everything now"
          subtitle="Every tool, game and widget from today, including locked tools and how to open them. For people who know their way around apps like this."
          alwaysShowSubtitle
          right={
            <Switch
              value={experienceMode === 'full'}
              onValueChange={(on) => setExperienceMode(on ? 'full' : 'auto')}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={experienceMode === 'full' ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />

        {/* Compass — the purpose/objective/gating layer. First under
            Personalization because it's the setting that changes most of
            what the rest of the app shows you. */}
        <SectionLabel label="Compass" c={c} t={t} s={s} />
        <SettingRow
          icon="navigate-outline"
          iconColor={c.gold}
          label={purpose ? purpose.label : 'Set your purpose'}
          subtitle={activeObjective?.active
            ? `On "${activeObjective.objective.label}" — ${activeObjective.done} of ${activeObjective.total} steps done`
            : 'One purpose, one objective at a time. Finishing one opens more of the app.'}
          alwaysShowSubtitle
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Compass')}
          c={c} t={t} s={s} r={r}
        />
        {/* Labs, Plus and the unlock tally belong to the last stage — before
            that, none of what they talk about is on show. Plus only once it
            can be bought: a plan row with nothing to buy is noise. */}
        {showAll && (<>
        <SettingRow
          icon="flask-outline"
          iconColor={c.purple}
          label="Experimental Features"
          subtitle="Shows work that isn't finished — rough layouts, thin empty states, things that may be rebuilt. Off by default so you never land in one by accident."
          alwaysShowSubtitle
          right={
            <Switch
              value={experimentalOn}
              onValueChange={setExperimental}
              trackColor={{ false: c.bg2, true: c.purple + '88' }}
              thumbColor={experimentalOn ? c.purple : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        {(plusOnSale || isPlus) && <SettingRow
          icon={isPlus ? 'star' : 'star-outline'}
          iconColor={c.gold}
          label={isPlus ? 'Plus' : 'Free plan'}
          subtitle={isPlus
            ? 'Business courses, Deep Insights, AI Import, custom objectives and Organizations are included. Manage your plan here.'
            : 'Get Plus for the business courses, Deep Insights, AI Import, custom objectives and Organizations. Everything else works the same on the free plan.'}
          alwaysShowSubtitle
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Plus')}
          c={c} t={t} s={s} r={r}
        />}
        <UnlockSummary accessFor={accessFor} c={c} t={t} s={s} r={r} onPress={() => navigation.navigate('Compass')} />
        </>)}

        {/* Personalization — same fields onboarding's Sectors / Look &
            Layout / Character steps set, editable here without re-running
            the whole flow */}
        <SectionLabel label="Personalization" c={c} t={t} s={s} />
        <SettingRow
          icon="easel-outline"
          iconColor="#b07be0"
          label="Teacher / Educator Mode"
          subtitle="Adds the Classroom Day Lesson Plan Builder and My Lesson Plans to Academy Classes. Off: Classes stays a learner's screen — subjects, readings, and quizzes only. Saved plans are kept either way."
          alwaysShowSubtitle
          right={
            <Switch
              value={educatorMode === true}
              onValueChange={setEducatorMode}
              trackColor={{ false: c.bg2, true: '#b07be088' }}
              thumbColor={educatorMode === true ? '#b07be0' : c.text4}
            />
          }
          c={c} t={t} s={s} r={r}
        />
        <LifeAreasPicker activeIds={activeLifeAreaIds} onToggle={toggleLifeArea} c={c} t={t} s={s} r={r} />
        <LibrarySectionsPicker hidden={hiddenSections} onToggle={toggleLibrarySection} c={c} t={t} s={s} r={r} />

        {/* Profile */}
        <SectionLabel label="Profile" c={c} t={t} s={s} />
        <SettingRow icon="person-outline" iconColor={c.teal} label="Edit Profile" subtitle="Update your display name, bio, and avatar"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Profile')}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="color-palette-outline" iconColor="#b07be0" label="Crest" subtitle="Crest color and role badge shown on Home & Portfolio"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => setShowCrestModal(true)}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="hand-left-outline" iconColor={c.teal} label="Tap Avatar for Profile" subtitle="Tap your character on the Training screen to open your Profile. Off: the tap makes them jump instead"
          right={
            <Switch
              value={heroTapEnabled}
              onValueChange={setHeroTapEnabled}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={heroTapEnabled ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r} />
        <TourSpot id="settings-family">
        <SettingRow icon="people-outline" iconColor="#e0a830" label="Family" subtitle="Link a parent/child account to follow progress"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Family')}
          c={c} t={t} s={s} r={r} />
        </TourSpot>
        <TourSpot id="settings-organization">
        <SettingRow icon="school-outline" iconColor="#2bb5a0" label="Organization" subtitle="Manage or join a class, team, or group"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('Organization')}
          c={c} t={t} s={s} r={r} />
        </TourSpot>

        {/* Moderation — only for accounts flagged is_admin. The RPCs behind
            this screen re-check that flag and raise NOT_AN_ADMIN, so hiding the
            row is presentation rather than access control. */}
        {liveProfile?.is_admin === true && (
          <SettingRow icon="shield-checkmark-outline" iconColor="#e05858" label="Moderation"
            subtitle="Review reported and filtered community posts"
            right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
            onPress={() => navigation.navigate('Library', { screen: 'ModerationQueueScreen' })}
            c={c} t={t} s={s} r={r} />
        )}

        {/* Notifications */}
        <SectionLabel label="Notifications" c={c} t={t} s={s} />
        <SettingRow icon="notifications-outline" iconColor="#4caf7d" label="Daily Reminders" subtitle="A nudge if today's Daily Drills are still open, or your streak is at risk"
          right={
            <Switch
              value={remindersEnabled}
              onValueChange={toggleReminders}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={remindersEnabled ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r} />

        {/* AI Import */}
        <SectionLabel label="AI Import" c={c} t={t} s={s} />
        <AIKeyCard c={c} t={t} s={s} r={r} />

        {/* Data */}
        <SectionLabel label="Data & Privacy" c={c} t={t} s={s} />
        {userId && !liveProfile?.date_of_birth && (
          <SettingRow icon="calendar-outline" iconColor="#e0a830" label="Birth Date" subtitle="Not added yet. Some features need it"
            alwaysShowSubtitle
            right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
            onPress={() => setShowDobModal(true)}
            c={c} t={t} s={s} r={r} />
        )}
        {/* Opens the Digital life area's privacy checklist — tips for your own
            online privacy, not settings for this app — so it's labelled that way. */}
        <SettingRow icon="shield-checkmark-outline" iconColor="#64b5f6" label="Privacy Checkup" subtitle="Your digital-privacy checklist"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Library', params: { screen: 'PrivacyScreen' } })}
          c={c} t={t} s={s} r={r} />
        {userId && (
          <SettingRow icon="download-outline" iconColor={c.gold} label="Export My Data" subtitle="A copy of everything this account has stored"
            right={exportingData ? <ActivityIndicator color={c.text4} size="small" /> : <Ionicons name="share-outline" size={16} color={c.text4} />}
            onPress={exportingData ? undefined : exportData}
            c={c} t={t} s={s} r={r} />
        )}

        {/* About */}
        <SectionLabel label="About" c={c} t={t} s={s} />
        <SettingRow icon="school-outline" iconColor="#b07be0" label="Replay Tutorial" subtitle="Take the guided tour of the app's features again"
          right={<Ionicons name="chevron-forward" size={16} color={c.text4} />}
          onPress={() => { navigation.navigate('MainTabs'); setTimeout(startTour, 300); }}
          c={c} t={t} s={s} r={r} />
        {/* Per-screen tutorials — see src/logic/useFirstVisitTutorial.js. The
            main teaching in the app now, which is why it defaults on. */}
        <SettingRow icon="chatbubbles-outline" iconColor="#b07be0" label="Screen Tutorials"
          subtitle="A short walkthrough the first time you open each screen"
          alwaysShowSubtitle
          right={
            <Switch
              value={screenTutorials !== false}
              onValueChange={setScreenTutorials}
              trackColor={{ false: c.bg2, true: c.teal + '88' }}
              thumbColor={screenTutorials !== false ? c.teal : c.text4}
            />
          }
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="refresh-outline" iconColor="#b07be0" label="Show All Tutorials Again"
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
        <SettingRow icon="information-circle-outline" iconColor={c.teal} label="App Version" subtitle="Deskartes · ChillTech Hub LLC"
          right={<Text style={{ fontSize: t.xs, color: c.text4 }}>v1.0.0</Text>}
          c={c} t={t} s={s} r={r} />
        <SettingRow icon="globe-outline" iconColor="#64b5f6" label="Privacy Policy"
          right={<Ionicons name="open-outline" size={16} color={c.text4} />}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          c={c} t={t} s={s} r={r} />
        {TERMS_URL ? (
          <SettingRow icon="document-text-outline" iconColor="#64b5f6" label="Terms of Service"
            right={<Ionicons name="open-outline" size={16} color={c.text4} />}
            onPress={() => Linking.openURL(TERMS_URL)}
            c={c} t={t} s={s} r={r} />
        ) : null}

        {/* Sign out */}
        <SectionLabel label="Account" c={c} t={t} s={s} />
        <TouchableOpacity onPress={signOut} disabled={signingOut}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, backgroundColor: '#e05858' + '18', borderRadius: r.md, padding: s.lg, borderWidth: 1, borderColor: '#e05858' + '44' }}>
          {signingOut
            ? <ActivityIndicator color="#e05858" size="small" />
            : <>
                <Ionicons name="log-out-outline" size={18} color="#e05858" />
                <Text style={{ color: '#e05858', fontWeight: t.bold, fontSize: t.sm }}>Sign Out</Text>
              </>
          }
        </TouchableOpacity>

        <SectionLabel label="Danger Zone" c={c} t={t} s={s} />
        <TouchableOpacity onPress={() => setShowDeleteModal(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s.sm, borderRadius: r.md, padding: s.lg, borderWidth: 1, borderColor: '#e05858' + '44' }}>
          <Ionicons name="trash-outline" size={16} color="#e05858" />
          <Text style={{ color: '#e05858', fontWeight: t.semibold, fontSize: t.xs }}>Delete Account</Text>
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
