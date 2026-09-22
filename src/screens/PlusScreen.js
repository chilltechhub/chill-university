// src/screens/PlusScreen.js
// The Plus screen: the paywall for someone on the free plan, and the
// "your plan" page for someone who has it.
//
// Opened with navigation.navigate('Plus', { from }), where `from` says what
// they bumped into (a locked business lesson, a Plus feature) so the first
// line can talk about that rather than a generic pitch.
//
// What the stores require on this screen, and why each bit is here:
//   - the price and billing period, from the store, next to the buy button
//   - what happens after the free trial, in plain words
//   - that it renews automatically, and how to cancel
//   - working links to Terms of Use and the Privacy Policy
//   - a Restore Purchases button
// Missing any of these is one of the most common App Store rejections.
//
// No Alert.alert anywhere: it does nothing on web, and a purchase result
// nobody sees is worse than none. Results are shown inline.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useUserProgress } from '../../context/UserProgressContext';
import { usePlus } from '../../context/PlusContext';
import { PRIVACY_POLICY_URL, SUBSCRIPTION_TERMS_URL } from '../config/legal';
import { getFeature } from '../data/featureCatalog';
import { FONTS } from '../theme';

const PERKS = [
  { icon: 'briefcase-outline', title: 'Every business & startup course',
    body: 'All of Business Foundations, Acquisition & Ownership, Startup & Venture and Operations & Compliance. The first lesson of each level is free, and Plus opens the rest.' },
  { icon: 'analytics-outline', title: 'Deep Insights',
    body: 'Your full history, with trends for each subject, not just the last two weeks.' },
  { icon: 'sparkles-outline', title: 'AI Import',
    body: 'Paste messy notes and they get sorted into real tasks, ideas and links.' },
  { icon: 'git-branch-outline', title: 'Custom Objectives',
    body: 'Write your own goal and its steps when none of ours fits.' },
  { icon: 'business-outline', title: 'Organizations & Cohorts',
    body: 'Run a class, team or group, with rosters, invites and assignments.' },
];

// What they bumped into, said back to them. `feature` with a featureId
// names the tool ("Deep Insights is part of Plus.").
const FROM_COPY = {
  business: 'The rest of this course is part of Plus.',
  feature: 'That one is part of Plus.',
  'ai-import': 'AI Import is part of Plus.',
};
// A free way to do the same job, said on the paywall so Plus never looks
// like the only road. Keyed like FROM_COPY / featureId.
const FREE_ALTERNATIVE = {
  'ai-import': 'Fill with AI stays free: it works with your own ChatGPT, Claude or Gemini.',
};

export default function PlusScreen() {
  const { colors: c, spacing: s, radius: r } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useUserProgress();
  const plus = usePlus();
  const st = useMemo(() => makeStyles(c, s, r), [c, s, r]);

  const from = route.params?.from;
  const featureId = route.params?.featureId || (from === 'ai-import' ? 'ai-import' : null);
  const feature = featureId ? getFeature(featureId) : null;
  const headline = (from === 'feature' && feature) ? `${feature.label} is part of Plus.` : FROM_COPY[from];
  const freeAlt = FREE_ALTERNATIVE[featureId];
  const [choice, setChoice] = useState(null);
  const [message, setMessage] = useState(null); // { tone: 'good'|'bad'|'info', text }

  const { ready, loadPackages, packages } = plus;
  useEffect(() => { if (ready && !plus.hasPlus) loadPackages(); }, [ready, plus.hasPlus, loadPackages]);

  // Default to yearly: it's the better deal, and it's where the trial is.
  useEffect(() => {
    if (!choice && packages?.length) setChoice(packages[0].id);
  }, [packages, choice]);

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'));
  const selected = packages?.find(p => p.id === choice) || null;
  const saving = yearlySaving(packages);

  const onBuy = async () => {
    if (!selected) return;
    setMessage(null);
    const res = await plus.buy(selected);
    if (res.ok) setMessage({ tone: 'good', text: 'You’re in. Everything in Plus is open now.' });
    else if (res.cancelled) setMessage(null);
    else if (res.pending) setMessage({ tone: 'info', text: 'Your payment is waiting on approval. Plus opens as soon as it goes through.' });
    else setMessage({ tone: 'bad', text: res.error || 'That didn’t go through. You haven’t been charged.' });
  };

  const onRestore = async () => {
    setMessage(null);
    const res = await plus.restore();
    if (res.ok) setMessage({ tone: 'good', text: 'Found it. Your Plus plan is back on this account.' });
    else if (res.error) setMessage({ tone: 'bad', text: res.error });
    else setMessage({ tone: 'info', text: 'No Plus purchase found for this store account.' });
  };

  return (
    <View style={st.container}>
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={close} style={st.close} hitSlop={10} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={c.text3} />
        </TouchableOpacity>

        <View style={st.hero}>
          <View style={st.starWrap}>
            <Ionicons name="star" size={30} color={c.gold} />
          </View>
          <Text style={st.kicker}>Deskartes Plus</Text>
          <Text style={st.title}>
            {plus.hasPlus ? 'You have Plus' : (headline || 'Go deeper')}
          </Text>
          {!plus.hasPlus && (
            <Text style={st.lede}>
              All the learning, games and life tools stay free. Plus adds the business courses and the power tools.
            </Text>
          )}
          {!plus.hasPlus && !!freeAlt && <Text style={st.freeAlt}>{freeAlt}</Text>}
        </View>

        {plus.hasPlus && <PlanStatus plus={plus} st={st} c={c} />}

        <View style={st.perks}>
          {PERKS.map(p => (
            <View key={p.title} style={st.perk}>
              <Ionicons name={plus.hasPlus ? 'checkmark-circle' : p.icon} size={20} color={plus.hasPlus ? c.teal : c.gold} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={st.perkTitle}>{p.title}</Text>
                <Text style={st.perkBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {!plus.hasPlus && (
          <Purchase
            plus={plus} user={user} packages={packages} selected={selected}
            setChoice={setChoice} saving={saving} onBuy={onBuy}
            st={st} c={c}
          />
        )}

        {!!message && (
          <Text style={[st.message, message.tone === 'good' && { color: c.success }, message.tone === 'bad' && { color: c.error }]}>
            {message.text}
          </Text>
        )}

        {/* Restore is required even for people who have Plus: a new phone
            or a reinstall starts with the store not knowing who they are. */}
        {plus.supported && !!user && (
          <TouchableOpacity onPress={onRestore} disabled={plus.busy} style={st.textBtn}>
            <Text style={st.textBtnLabel}>Restore purchases</Text>
          </TouchableOpacity>
        )}

        <View style={st.legalRow}>
          <Text style={st.legalLink} onPress={() => Linking.openURL(SUBSCRIPTION_TERMS_URL)}>Terms of Use</Text>
          <Text style={st.legalDot}>·</Text>
          <Text style={st.legalLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>Privacy Policy</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Purchase({ plus, user, packages, selected, setChoice, saving, onBuy, st, c }) {
  if (!user) {
    return <Text style={st.note}>Sign in to get Plus. It stays with your account, not the phone.</Text>;
  }
  if (!plus.supported) {
    return (
      <Text style={st.note}>
        {Platform.OS === 'web'
          ? 'Plus is bought in the Deskartes app on iPhone or Android. Once you have it, it works here too when you sign in.'
          : 'Purchases aren’t set up in this build yet.'}
      </Text>
    );
  }
  if (!plus.ready || packages === null) {
    return <ActivityIndicator color={c.gold} style={{ marginVertical: 24 }} />;
  }
  if (!packages.length) {
    return (
      <View>
        <Text style={st.note}>{plus.packagesError || 'The store didn’t return any plans. Check your connection and try again.'}</Text>
        <TouchableOpacity onPress={plus.loadPackages} style={st.textBtn}>
          <Text style={st.textBtnLabel}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const trial = selected?.trialDays || 0;
  const per = selected?.kind === 'yearly' ? 'year' : 'month';

  return (
    <View>
      <View style={st.plans}>
        {packages.map(p => {
          const on = p.id === selected?.id;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setChoice(p.id)}
              activeOpacity={0.85}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              style={[st.plan, on && { borderColor: c.gold, backgroundColor: c.goldLight + '55' }]}
            >
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? c.gold : c.text4} />
              <View style={{ flex: 1 }}>
                <Text style={st.planName}>{p.kind === 'yearly' ? 'Yearly' : 'Monthly'}</Text>
                <Text style={st.planSub}>
                  {p.kind === 'yearly' && p.pricePerMonth ? `${p.pricePerMonth}/mo, billed yearly` : 'Billed monthly'}
                  {p.trialDays ? ` · ${p.trialDays} days free` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={st.planPrice}>{p.price}</Text>
                {p.kind === 'yearly' && saving > 0 && (
                  <Text style={st.saveTag}>Save {saving}%</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={onBuy}
        disabled={!selected || plus.busy}
        activeOpacity={0.9}
        style={[st.cta, (!selected || plus.busy) && { opacity: 0.6 }]}
      >
        {plus.busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={st.ctaText}>{trial ? `Start ${trial}-day free trial` : 'Subscribe'}</Text>}
      </TouchableOpacity>

      {/* The auto-renew disclosure, in plain words, right under the button. */}
      {selected && (
        <Text style={st.fine}>
          {trial
            ? `Free for ${trial} days, then ${selected.price} a ${per}. `
            : `${selected.price} a ${per}. `}
          Renews automatically until you cancel. Cancel any time in your {storeName()} subscriptions, at least 24 hours before
          {trial ? ' the trial ends' : ' the period ends'}, and you won’t be charged again.
        </Text>
      )}
    </View>
  );
}

function PlanStatus({ plus, st, c }) {
  const { expiresAt, period, willRenew } = plus.plan;
  const date = expiresAt ? new Date(expiresAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null;
  let line;
  if (!expiresAt) line = 'Your plan doesn’t expire.';
  else if (period === 'trial') line = willRenew === false
    ? `Your free trial ends ${date}, and it won’t renew.`
    : `Your free trial ends ${date}, then your plan starts.`;
  else if (period === 'grace') line = `There’s a problem with your payment. Plus stays on until ${date} while the store retries.`;
  else line = willRenew === false ? `Plus stays on until ${date}, and won’t renew.` : `Renews ${date}.`;

  return (
    <View style={st.statusCard}>
      <Text style={st.statusText}>{line}</Text>
      {plus.supported && (
        <TouchableOpacity onPress={() => Linking.openURL(plus.manageUrl())} style={st.manageBtn}>
          <Ionicons name="open-outline" size={15} color={c.teal} />
          <Text style={st.manageText}>Manage or cancel subscription</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function storeName() {
  if (Platform.OS === 'ios') return 'App Store';
  if (Platform.OS === 'android') return 'Google Play';
  return 'store';
}

// How much cheaper yearly is than twelve months, rounded down so the badge
// never overstates it.
function yearlySaving(packages) {
  const y = packages?.find(p => p.kind === 'yearly')?.raw?.product?.price;
  const m = packages?.find(p => p.kind === 'monthly')?.raw?.product?.price;
  if (!y || !m) return 0;
  return Math.max(0, Math.floor((1 - y / (m * 12)) * 100));
}

const makeStyles = (c, s, r) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg0 },
  scroll: { padding: s.lg, paddingBottom: 48, maxWidth: 560, width: '100%', alignSelf: 'center' },
  close: { alignSelf: 'flex-end', padding: 4 },

  hero: { alignItems: 'center', marginBottom: s.lg },
  starWrap: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: c.goldLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  kicker: {
    fontSize: 11, fontFamily: FONTS.mono, color: c.gold, letterSpacing: 1.2,
    textTransform: 'uppercase', fontWeight: '800', marginBottom: 4,
  },
  title: { fontSize: 28, fontFamily: FONTS.display, fontWeight: '800', color: c.text1, textAlign: 'center' },
  lede: { fontSize: 14, color: c.text2, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  freeAlt: { fontSize: 13, color: c.teal, fontWeight: '600', lineHeight: 19, textAlign: 'center', marginTop: 8 },

  perks: {
    backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 1, borderColor: c.border,
    padding: s.md, gap: 14, marginBottom: s.lg,
  },
  perk: { flexDirection: 'row', gap: 12 },
  perkTitle: { fontSize: 15, fontWeight: '700', color: c.text1 },
  perkBody: { fontSize: 13, color: c.text3, lineHeight: 18, marginTop: 2 },

  plans: { gap: 10, marginBottom: s.md },
  plan: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: s.md, borderRadius: r.lg, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.bg1,
  },
  planName: { fontSize: 15, fontWeight: '700', color: c.text1 },
  planSub: { fontSize: 12, color: c.text3, marginTop: 2 },
  planPrice: { fontSize: 16, fontWeight: '800', color: c.text1 },
  saveTag: { fontSize: 10, fontFamily: FONTS.mono, fontWeight: '800', color: c.gold, marginTop: 2 },

  cta: {
    backgroundColor: c.gold, borderRadius: r.lg, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  fine: { fontSize: 11, color: c.text3, lineHeight: 16, textAlign: 'center', marginTop: 10 },

  note: { fontSize: 14, color: c.text2, lineHeight: 20, textAlign: 'center', marginVertical: s.md },
  message: { fontSize: 14, color: c.text2, textAlign: 'center', marginTop: s.md, lineHeight: 20 },

  statusCard: {
    backgroundColor: c.bg1, borderRadius: r.lg, borderWidth: 1, borderColor: c.border,
    borderLeftWidth: 3, borderLeftColor: c.gold, padding: s.md, marginBottom: s.lg,
  },
  statusText: { fontSize: 14, color: c.text1, lineHeight: 20 },
  manageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  manageText: { fontSize: 13, fontWeight: '700', color: c.teal },

  textBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16, marginTop: 4 },
  textBtnLabel: { fontSize: 13, fontWeight: '700', color: c.text2, textDecorationLine: 'underline' },

  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  legalLink: { fontSize: 12, color: c.text3, textDecorationLine: 'underline' },
  legalDot: { fontSize: 12, color: c.text4 },
});
