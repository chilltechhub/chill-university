// src/screens/LoginScreen.js
// Clean auth screen — space traveler theme, handles both login and signup

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabaseClient';
import { useNavigation } from '@react-navigation/native';
import { redeemOrgInviteCode } from '../api/organizationService';

// If a signup happens before email confirmation, there's no session yet to
// redeem the code against — stash it here and retry the next time a
// session shows up (see maybeRedeemPendingOrgCode, called from
// goAfterAuth on every successful login, not just signup).
const PENDING_ORG_CODE_KEY = '@cth_pending_org_code';

async function maybeRedeemPendingOrgCode() {
  try {
    const code = await AsyncStorage.getItem(PENDING_ORG_CODE_KEY);
    if (!code) return;
    await AsyncStorage.removeItem(PENDING_ORG_CODE_KEY); // clear first — never retry-loop a bad/expired code
    const result = await redeemOrgInviteCode(code);
    const label = result?.cohort_name || result?.organization_name;
    if (label) Alert.alert('Joined!', `You're now part of ${label}.`);
  } catch (e) {
    // Not fatal — the org system may not be configured yet, or the code
    // was invalid/expired. Silent: this runs on every login, not just the
    // one signup where the user actually typed the code.
    console.warn('maybeRedeemPendingOrgCode', e?.message || e);
  }
}

export default function LoginScreen({ onSuccess, onClose }) {
  const navigation = useNavigation();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [displayName, setDisplayName] = useState('');
  const [orgCode,     setOrgCode]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [mode,        setMode]        = useState('login'); // login | signup | reset
  const [showPass,    setShowPass]    = useState(false);

  const goAfterAuth = async (user) => {
  try {
    await maybeRedeemPendingOrgCode();

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();

    const needsOnboarding = !profile || profile.onboarding_completed !== true;
    const target = needsOnboarding ? 'MultiStepOnboarding' : 'MainTabs';

    if (onSuccess) {
      // Reached as a Modal overlay (TopBar / the floating action button),
      // from a screen the guest was already on — not the root stack's own
      // 'Login' route, so there's no Login entry sitting in history to
      // worry about. Just close the modal; only navigate if onboarding is
      // actually required.
      onSuccess();
      if (needsOnboarding) navigation.navigate('MultiStepOnboarding');
      return;
    }

    // Reached as the root Stack's own 'Login' screen (fresh launch, no
    // session). reset(), not navigate() — navigate() just pushes the next
    // screen on top of Login, so Login is still underneath in history and
    // a swipe-back gesture pops right back to it. reset() clears Login out
    // of the stack entirely, so there's nothing behind the new screen to
    // swipe back to.
    navigation.reset({ index: 0, routes: [{ name: target }] });
  } catch (e) {
    console.warn('goAfterAuth', e);
    // Fallback — just call onSuccess and let App.js handle routing
    if (onSuccess) onSuccess();
  }
};

  const handleReset = async () => {
    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail) {
      Alert.alert('Missing email', 'Enter the email address on your account.');
      return;
    }
    setLoading(true);
    try {
      // Without this, Supabase falls back to whatever Site URL is set in
      // the dashboard (Authentication → URL Configuration) — which is what
      // sent the last reset link to a dead localhost:8081 that nothing was
      // running on. window.location.origin is only meaningful on web (this
      // exact origin also needs to be in that project's Redirect URLs
      // allow-list, or Supabase ignores it and falls back the same way).
      const redirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.location.origin
        : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(trimEmail, redirectTo ? { redirectTo } : undefined);
      // Supabase returns success here even for an email with no account —
      // that's deliberate on its side (don't let this screen reveal which
      // emails are registered), so the same confirmation covers both cases.
      if (error) { Alert.alert("Couldn't send that", error.message); return; }
      Alert.alert(
        'Check your email 📬',
        `If there's an account for ${trimEmail}, a reset link is on its way.`,
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.warn('reset error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'reset') { await handleReset(); return; }

    const trimEmail = email.trim().toLowerCase();
    if (!trimEmail || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email: trimEmail, password });
        if (error) { Alert.alert('Sign in failed', error.message); return; }
        if (data.user) await goAfterAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimEmail, password,
          options: { data: { display_name: displayName.trim() || trimEmail.split('@')[0] } },
        });
        if (error) { Alert.alert('Sign up failed', error.message); return; }

        // Stashed regardless of whether a session exists yet — if email
        // confirmation is required, this survives until the user actually
        // logs in and goAfterAuth runs maybeRedeemPendingOrgCode.
        const trimCode = orgCode.trim();
        if (trimCode) await AsyncStorage.setItem(PENDING_ORG_CODE_KEY, trimCode);

        if (data.user) {
          // Manual profile create as safety net for trigger
          await supabase.from('profiles').upsert({
            id:                   data.user.id,
            display_name:         displayName.trim() || trimEmail.split('@')[0],
            username:             trimEmail.split('@')[0],
            email:                trimEmail,
            points:               0,
            xp:                   0,
            level:                1,
            rank:                 20,
            streak_count:         0,
            onboarding_completed: false,
          });

          if (data.session) {
            await goAfterAuth(data.user);
          } else {
            Alert.alert(
              'Check your email 📬',
              'We sent you a confirmation link. Click it then come back to sign in.',
              [{ text: 'OK', onPress: () => setMode('login') }]
            );
          }
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.warn('auth error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Close button */}
      {onClose && (
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      )}

      {/* Stars bg decoration */}
      <View style={s.stars}>
        {['✦','·','✦','·','✦','·','✦'].map((ch, i) => (
          <Text key={i} style={[s.star, { opacity: 0.1 + i * 0.05, fontSize: 8 + (i % 3) * 4, top: 40 + i * 30, left: 20 + i * 42 }]}>{ch}</Text>
        ))}
      </View>

      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logoEmoji}>🛸</Text>
          <Text style={s.ornament}>✦  ·  ·  ✦</Text>
          <Text style={s.appName}>ChillTech Hub</Text>
          <Text style={s.tagline}>Tech for the rest of us</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>
            {mode === 'login' ? 'Welcome back, Traveler'
              : mode === 'reset' ? 'Recover your base'
              : 'Begin your mission'}
          </Text>
          <Text style={s.cardSub}>
            {mode === 'login' ? 'Sign in to return to your base'
              : mode === 'reset' ? "Enter your email and we'll send a reset link"
              : 'Create your account to launch'}
          </Text>

          {/* Display name (signup only) */}
          {mode === 'signup' && (
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Display name"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Organization code (signup only, optional) — joins a school/
              business/other org right at signup so the rest of the app
              (see src/data/orgLabels.js) can speak that org's vocabulary
              from the very first screen, instead of a bare personal
              account that joins one later from Settings. */}
          {mode === 'signup' && (
            <View style={s.inputWrap}>
              <Ionicons name="school-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Organization code (optional)"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={orgCode}
                onChangeText={(v) => setOrgCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
            </View>
          )}
          {mode === 'signup' && (
            <Text style={s.orgHint}>Got a code from a school or team? Enter it to join right away.</Text>
          )}

          {/* Email */}
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Password (not shown while recovering — reset only needs the email above) */}
          {mode !== 'reset' && (
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color="rgba(255,255,255,0.3)" style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          )}

          {/* Forgot password (login only) */}
          {mode === 'login' && (
            <TouchableOpacity onPress={() => setMode('reset')} style={s.forgotRow}>
              <Text style={s.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Submit */}
          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={s.btnText}>
                    {mode === 'login' ? 'Enter Base' : mode === 'reset' ? 'Send Reset Link' : 'Launch Mission'}
                  </Text>
                  <Text style={s.btnEmoji}>{mode === 'login' ? '🚀' : mode === 'reset' ? '📡' : '🛸'}</Text>
                </>
            }
          </TouchableOpacity>

          {/* Switch mode */}
          {mode === 'reset' ? (
            <TouchableOpacity style={s.switchRow} onPress={() => setMode('login')}>
              <Text style={s.switchText}>
                <Text style={s.switchLink}>← Back to sign in</Text>
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.switchRow} onPress={() => setMode(m => m === 'login' ? 'signup' : 'login')}>
              <Text style={s.switchText}>
                {mode === 'login' ? "New traveler? " : 'Already have a base? '}
                <Text style={s.switchLink}>{mode === 'login' ? 'Create account' : 'Sign in'}</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Guest — always available, not just when this screen is a Modal
              overlay. Reached as the root Stack's own 'Login' screen (fresh
              launch, no session), onClose is undefined, so tapping this
              resets straight into MainTabs instead: guests skip onboarding
              entirely (it writes to a `profiles` row keyed on a real
              Supabase user id, which a guest doesn't have) and land on Home
              with local-only defaults — the same character/crest loadout
              and points/xp tracking TopBar and useCharacterLoadout already
              handle for a null `user` (see UserProgressContext's
              guestPoints/guestXp/recordGuestEvent). */}
          <TouchableOpacity
            style={s.guestBtn}
            onPress={() => {
              if (onClose) { onClose(); return; }
              navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }}
          >
            <Text style={s.guestText}>Continue as guest — progress won't be saved</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: '#080612', justifyContent: 'center' },
  closeBtn:    { position: 'absolute', top: 54, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  stars:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  star:        { position: 'absolute', color: '#fff' },
  content:     { paddingHorizontal: 24 },
  logoWrap:    { alignItems: 'center', marginBottom: 32 },
  logoEmoji:   { fontSize: 56, marginBottom: 8 },
  ornament:    { color: '#c9a84c', fontSize: 13, letterSpacing: 8, marginBottom: 6 },
  appName:     { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tagline:     { fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  card:        { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 24, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  cardTitle:   { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 6 },
  cardSub:     { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 24 },
  inputWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  inputIcon:   { marginRight: 8 },
  orgHint:     { fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: -6, marginBottom: 12, marginLeft: 2 },
  forgotRow:   { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
  forgotText:  { fontSize: 12.5, color: '#2bb5a0', fontWeight: '600' },
  input:       { flex: 1, paddingVertical: 14, fontSize: 15, color: '#fff' },
  btn:         { backgroundColor: '#2bb5a0', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnEmoji:    { fontSize: 16 },
  switchRow:   { marginTop: 18, alignItems: 'center' },
  switchText:  { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  switchLink:  { color: '#2bb5a0', fontWeight: '600' },
  guestBtn:    { marginTop: 14, alignItems: 'center' },
  guestText:   { fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});
